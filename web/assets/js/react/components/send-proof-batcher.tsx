import React, { useEffect, useState } from "react";
import { useConfig, useAccount, useSignMessage, usePublicClient, useEstimateFeesPerGas } from "wagmi";
import * as CBOR from 'cbor2';
import { parseSignature } from 'viem'

// TO-DO: Find a way to remove this node.js dependency
import { Keccak } from "sha3";

function SubmitProofToBatcher() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const publicClient = usePublicClient();
  const estimatedFees = useEstimateFeesPerGas();

  const [proof, setProof] = useState<Uint8Array | null>(null);
  const [vk, setVk] = useState<Uint8Array | null>(null);
  const [pub, setPub] = useState<Uint8Array | null>(null);
  const [alignedData, setAlignedData] = useState<AlignedVerificationData[] | null>(null);

  const handleSign = async (message: any) => {
    try {
      const json = JSON.stringify(message, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
      const signature = await signMessageAsync({ 
        message: json
      });
      
      if (!signature) {
        throw new Error("Failure obtaining the sign");
      }
      
      const { r, s, v } = parseSignature(signature);
      
      if (!v) {
        throw new Error("Failure obtaining the sign, v is undefined");
      }
      
      return { r, s, v };
    } catch (error) {
      console.error("Failure in handleSign:", error);
      throw new Error("Failure obtaining sign: " + error.message);
    }
  }

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "proof" | "vk" | "pub"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    if (type === "proof") setProof(data);
    else if (type === "vk") setVk(data);
    else if (type === "pub") setPub(data);
  };

  const signer = async (data: VerificationData) => {
    const json = JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    return await signMessageAsync({
      message: json,
    });
  };

  const getNonce = async () => {
    if (!address) {
      alert("Address was undefined");
      throw new Error("Address undefined");
    }

    const nonce = await publicClient?.getTransactionCount({
      address,
    });

    if (nonce === undefined) {
      throw new Error("Could not get nonce");
    }

    return nonce;
  };

  const getMaxFeePerGas = async () => {
    const maxFeePerGas = estimatedFees.data?.maxFeePerGas;

    if (!maxFeePerGas) {
      alert("Max fee per gas was undefined");
      throw new Error("Max fee per gas undefined");
    }

    return maxFeePerGas;
  };

  const handleSubmit = async () => {
    if (!proof || !vk || !pub || !address) {
      alert("Files or address missing");
      return;
    }

    try {
      const groth16Data: VerificationData = {
        provingSystem: ProvingSystemId.Groth16Bn254,
        proof,
        publicInput: Option.from(pub),
        verificationKey: Option.from(vk),
        vmProgramCode: Option.None,
        proofGeneratorAddress: address,
      };

      const result = await SubmitMultiple([groth16Data, groth16Data], signer, getNonce, getMaxFeePerGas, handleSign);
      console.log("Result:", result);
      setAlignedData(result);
    } catch (error) {
      console.error("Failure sending the proof: ", error);
      alert("Failure sending the proof: " + error.message);
    }
  };

  return (
    <div>
      <h2>Upload the required files for the groth16 proof:</h2>

      <div style={{padding: "8px 16px"}}>
        <label style={{marginRight:10}}>.proof file:</label>
        <input type="file" onChange={(e) => handleFile(e, "proof")} />
      </div>

      <div style={{padding: "8px 16px"}}>
        <label style={{marginRight:10}}>.vk file:</label>
        <input type="file" onChange={(e) => handleFile(e, "vk")} />
      </div>

      <div style={{padding: "8px 16px"}}>
        <label style={{marginRight:10}}>.pub file:</label>
        <input type="file" onChange={(e) => handleFile(e, "pub")} />        
      </div>

      <button
        onClick={handleSubmit}
        style={{ border: "2px solid black", padding: "8px 16px", cursor: "pointer", marginLeft:20, marginTop:10 }}
      >
        Send to batcher
      </button>

      <p>
        {alignedData
          ? <pre>{JSON.stringify(alignedData, null, 2)}</pre>
          : ""}
      </p>
    </div>
  );
}

const SubmitMultiple = async (
  verificationData: VerificationData[],
  signer: (data: VerificationData) => Promise<string>,
  getNonce: () => Promise<number>,
  getMaxFeePerGas: () => Promise<bigint>,
  handleSign: (message: any) => Promise<{
    r: `0x${string}`;
    s: `0x${string}`;
    v: bigint;
  }>
): Promise<AlignedVerificationData[]> => {
  const instance = "ws://localhost:8080"; // This is the batcher web socket address
  const ws = await openWebSocket(instance);

  let sentVerificationData: VerificationData[] = [];

  const preparedData = await Promise.all(
    verificationData.map(async (data) => {
      sentVerificationData.push(data);
      const sig = await signer(data);
      return {
        verificationData: data,
        signature: sig
      };
    })
  );

  let reverseCommitments = sentVerificationData
    .slice()
    .reverse()
    .map((data) => VerificationDataCommitment.fromData(data));

  const receivePromise = receiveResponse(reverseCommitments.length, ws);

  console.log("Sending prepared data:", preparedData.length);
  
  await new Promise(resolve => setTimeout(resolve, 100));

  const item = preparedData[0];

  const nonce = await getNonce();

  const maxFeePerGas = await getMaxFeePerGas();
  
  const message = {
    verification_data: {
      proving_system: "GnarkGroth16Bn254",
      proof: Array.from(item.verificationData.proof),
      pub_input: Array.from(item.verificationData.publicInput.data!),
      verification_key: Array.from(item.verificationData.verificationKey.data!),
      vm_program_code: item.verificationData.vmProgramCode.isSome ?
        Array.from(item.verificationData.vmProgramCode.data!) : null,
      proof_generator_addr: item.verificationData.proofGeneratorAddress,
    },
    nonce: nonce.toString(16),
    max_fee: maxFeePerGas.toString(16),
    chain_id: "0x7A69",
    payment_service_addr: "0x7969c5ed335650692bc04293b07f5bf2e7a673c0",
  };
      
  const sig = await handleSign(message);

  const submitProofMessage = {
    SubmitProof: {
      verification_data: message,
      signature: {
        r: sig.r,
        s: sig.s,
        v: sig.v
      }
    }
  };

  console.log("Message to send:", submitProofMessage);

  const serializedMessage = new Uint8Array(CBOR.encode(submitProofMessage));

  if (ws.readyState === WebSocket.OPEN) {
    console.log("Sending CBOR message of ", serializedMessage, "bytes");
    ws.send(serializedMessage);
    console.log("CBOR message sent correctly");
  } else {
    console.error("WebSocket not open. State:", ws.readyState);
    throw new Error("WebSocket not open");
  }
 
  const receivedData = await receivePromise;

  const alignedVerificationData: AlignedVerificationData[] = [];

  receivedData.forEach((data) => {
    const commitment = reverseCommitments.pop()!;
    if (
      verifyMerklePath(
        data.batchInclusionProof.merkle_path,
        data.batchMerkleRoot,
        data.indexInBatch,
        commitment
      )
    ) {
      alignedVerificationData.push(
        AlignedVerificationData.from(commitment, data)
      );
    }
  });

  ws.close();
  return alignedVerificationData;
};

const verifyMerklePath = (
  path: Array<Uint8Array>,
  root: Uint8Array,
  index: number,
  data: VerificationDataCommitment
) => {
  const Hash = new Keccak(256);
  let commitment = VerificationDataCommitment.hashData(data);

  path.forEach((node) => {
    if (index % 2 === 0) {
      commitment = Hash.update(commitment).update(node).digest();
    } else {
      commitment = Hash.update(node).update(commitment).digest();
    }
    Hash.reset();
    index >>= 1;
  });

  return uint8ArraysEqual(root, commitment);
};

const receiveResponse = (expectedCount: number, ws: WebSocket): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const receivedData: any[] = [];
    
    ws.onmessage = (event) => {
      try {
        let data;
        
        if (event.data instanceof ArrayBuffer) {
          data = CBOR.decode(new Uint8Array(event.data));
        } else if (typeof event.data === 'string') {
          data = JSON.parse(event.data);
        } else {
          data = CBOR.decode(event.data);
        }
        
        receivedData.push(data);
        
        if (receivedData.length === expectedCount) {
          resolve(receivedData);
        }
      } catch (error) {
        console.error("Error decoding response:", error);
        reject(error);
      }
    };
    
    ws.onerror = (error) => {
      reject(error);
    };
  });
};

const openWebSocket = (address: string): Promise<WebSocket> => {
  return new Promise(function (resolve, reject) {
    const ws = new WebSocket(address);

    ws.addEventListener("open", () => {
      console.log("WebSocket connection open");
    });

    ws.addEventListener("message", async (event: MessageEvent) => {
      console.log("Message received on handshake:", event.data);
      console.log("Data type:", typeof event.data);
      
      let buffer: Uint8Array;
      
      if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        buffer = new Uint8Array(arrayBuffer);
      } else if (event.data instanceof ArrayBuffer) {
        buffer = new Uint8Array(event.data);
      } else if (typeof event.data === 'string') {
        buffer = new TextEncoder().encode(event.data);
      } else {
        console.error("Unsupported data type:", event.data);
        reject(new Error("Unsupported data type in handshake"));
        return;
      }

      const expectedProtocolVersion = ProtocolVersion.fromBytesBuffer(buffer);

      if (0 !== expectedProtocolVersion) {
        reject(new Error(
          `Unsupported Protocol version. Expected ${0} but got ${expectedProtocolVersion}`
        ));
        return;
      }

      console.log("Compatible protocol, resolving web socket");
      resolve(ws);
    });

    ws.addEventListener('error', error => {
      console.error("Error in WebSocket:", error);
      reject(`Cannot connect to ${address}, received error: ${error}`);
    });

    ws.addEventListener('close', event => {
      console.error("WebSocket closed during handshake:", event.reason);
      reject(`WebSocket closed during handshake: ${event.reason}`);
    });
  });
};

export default SubmitProofToBatcher;

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function hexStringToBytes(hex: string): Uint8Array {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type Option<T> = {
  isSome: boolean;
  data: T | undefined;
};
const Option = {
  from<T>(data: T): Option<T> {
    return {
      isSome: true,
      data,
    };
  },
  None: {
    isSome: false,
    data: undefined,
  },
};

type ProvingSystemId = number;
const ProvingSystemId = {
  GnarkPlonkBls12_381: 0,
  GnarkPlonkBn254: 1,
  Groth16Bn254: 2,
  SP1: 3,
  Halo2KZG: 4,
  Halo2IPA: 5,
  Risc0: 6,
  toString: (id: number) => {
    switch (id) {
      case 0:
        return "GnarkPlonkBls12_381";
      case 1:
        return "GnarkPlonkBn254";
      case 2:
        return "GnarkGroth16Bn254";
      case 3:
        return "SP1";
      case 4:
        return "Halo2IPA";
      case 5:
        return "Halo2KZG";
      case 6:
        return "Risc0";
      default:
        throw Error("Unsupported proof system ID");
    }
  },
};

type VerificationData = {
  provingSystem: ProvingSystemId;
  proof: Uint8Array;
  publicInput: Option<Uint8Array>;
  verificationKey: Option<Uint8Array>;
  vmProgramCode: Option<Uint8Array>;
  proofGeneratorAddress: string;
};

type VerificationDataCommitment = {
  proofCommitment: Uint8Array;
  publicInputCommitment: Uint8Array;
  provingSystemAuxDataCommitment: Uint8Array;
  proofGeneratorAddr: Uint8Array;
};
const VerificationDataCommitment = {
  fromData(data: VerificationData): VerificationDataCommitment {
    const Hash = new Keccak(256);

    // proof commitment
    console.log("Data proof is: ", data.proof)

    const proofStr = uint8ArrayToHex(data.proof);
    console.log("Data proof into string is ", proofStr);

    let proofCommitment = Hash.update(proofStr).digest();
    Hash.reset();
    // compute public input commitment
    let publicInputCommitment = new Uint8Array(32).fill(0);
    publicInputCommitment = (data.publicInput.isSome && data.publicInput.data)
      ? Hash.update(uint8ArrayToHex(data.publicInput.data)!).digest()
      : publicInputCommitment;
    Hash.reset();
    // aux commitment
    let provingSystemAuxDataCommitment = new Uint8Array(32).fill(0);
    if (data.vmProgramCode.isSome) {
      provingSystemAuxDataCommitment = Hash.update(
        data.vmProgramCode.data!
      ).digest();
      Hash.reset();
    } else if (data.verificationKey.isSome && data.verificationKey.data) {
      provingSystemAuxDataCommitment = Hash.update(
        uint8ArrayToHex(data.verificationKey.data)!
      ).digest();
      Hash.reset();
    }

    let proofGeneratorAddr = hexStringToBytes(data.proofGeneratorAddress);
    return {
      proofCommitment,
      publicInputCommitment,
      provingSystemAuxDataCommitment,
      proofGeneratorAddr,
    };
  },
  hashData(data: VerificationDataCommitment) {
    const Hash = new Keccak(256);
    Hash.update(data.proofCommitment);
    Hash.update(data.publicInputCommitment);
    Hash.update(data.provingSystemAuxDataCommitment);
    Hash.update(data.proofGeneratorAddr);
    return Hash.digest();
  },
};

type AlignedVerificationData = {
  verificationDataCommitment: VerificationDataCommitment;
  batchMerkleRoot: Uint8Array;
  batchInclusionProof: InclusionProof;
  indexInBatch: number;
};
const AlignedVerificationData = {
  from(
    verificationDataCommitment: VerificationDataCommitment,
    data: BatchInclusionData
  ): AlignedVerificationData {
    return {
      verificationDataCommitment,
      ...data,
    };
  },
};

type InclusionProof = {
  merkle_path: Array<Uint8Array>;
};
type BatchInclusionData = {
  batchMerkleRoot: Uint8Array;
  batchInclusionProof: InclusionProof;
  indexInBatch: number;
};
const BatchInclusionData = {
  fromBuffer(data: Uint8Array) {
    const json = JSON.parse(new TextDecoder().decode(data));
    return {
      batchMerkleRoot: new Uint8Array(json.batch_merkle_root),
      batchInclusionProof: {
        merkle_path: json.batch_inclusion_proof.merkle_path.map((x: number[]) => new Uint8Array(x)),
      },
      indexInBatch: Number(json.index_in_batch),
    };
  },
};

type ProtocolVersion = number;
const ProtocolVersion = {
  fromBytesBuffer: (bytes: Uint8Array): ProtocolVersion => {
    console.log("Bytes received for protocol version:", bytes);
    console.log("Bytes length:", bytes.byteLength);
    
    if (bytes.byteLength === 0) {
      console.error("Received empty bytes for protocol version");
      return 0;
    }
    
    try {      
      if (bytes.byteLength > 0) {
        console.log("Assuming protocol version 0 from CBOR data");
        return 0;
      }
      
      return 0;
    } catch (error) {
      console.error("Error parsing protocol version:", error);
      return 0;
    }
  },
};
