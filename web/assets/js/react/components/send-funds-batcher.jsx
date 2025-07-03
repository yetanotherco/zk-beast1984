import React, { useState, useEffect } from "react";
import { parseEther } from "viem";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";

function SendFundsToContract({ contract_address }) {
  const [amount, setAmount] = useState("");
  const [showForm, setShowForm] = useState(false);

  const contractAddress = contract_address;

  const {
    data: hash,
    error,
    isPending,
    sendTransaction
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({ hash });

  async function handleSend(e) {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      console.error("Valid amount is required");
      return;
    }

    try {
      sendTransaction({
        to: contractAddress,
        value: parseEther(amount.toString())
      });
    } catch (err) {
      console.error("Error sending transaction:", err);
    }
  }

  if (isConfirmed && amount) {
    setAmount("");
  }

  useEffect(() => {
    if (isConfirmed) {
      window.location.reload();
    }
  }, [isConfirmed]);

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{ border: "2px solid black", padding: "8px 16px", cursor: "pointer" }}
        >
          Send funds
        </button>
      ) : (
        <>
        <button
          onClick={() => setShowForm(false)}
          style={{ marginBottom: '10px', border: "2px solid black", padding: "8px 16px", cursor: "pointer" }}
        >
          X
        </button>

          <div style={{ marginBottom: '10px' }}>
            <strong>Contract address:</strong> {contractAddress}
          </div>

        <form onSubmit={handleSend} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
            id="amount"
            type="number"
            value={amount}
            step="0.001"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            style={{ padding: '8px', borderRadius: '4px', fontSize: '16px', flex: '1' }}
            disabled={isPending}
            />
            <span style={{ position: 'relative', right: '70px' }}>
                eth
            </span>
            <button
            type="submit"
            disabled={
                isPending || !contractAddress || !amount || parseFloat(amount) <= 0
            }
            style={{
                border: '2px solid black',
                padding: '8px 16px',
                cursor: 'pointer'
            }}
            >
            {isPending ? 'Sending...' : 'Send Funds'}
            </button>
        </div>
        </form>

          {hash && (
            <div>
              <p>Tx Hash: {hash}</p>
              {isConfirming && <div>Waiting confirmation...</div>}
            </div>
          )}

          {error && (
            <div>
              Error: {error.message}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SendFundsToContract;
