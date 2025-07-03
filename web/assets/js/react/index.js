import { define } from "remount";
import AppAgreementSubmit from "./app-agreement-submit";
import AppGetUserBalance from "./app-get-user-balance";
import AppDisconnectUser from "./app-user-disconnect";
import AppSendFundsToBatcher from "./app-send-funds-batcher";
import AppSubmitProofToBatcher from "./app-submit-proof-batcher"

define(
    { "x-app-agreement-submit": AppAgreementSubmit },
    { attributes: ["network"] }
);

define(
    { "x-app-get-user-balance": AppGetUserBalance },
    { attributes: ["network", "payment_service_address", "user_address"] }
);

define(
    { "x-app-disconnect-user": AppDisconnectUser },
    {attributes: ["network"] }
);

define(
    { "x-app-send-funds-batcher": AppSendFundsToBatcher },
    {attributes: ["network", "payment_service_address"] }
);

define(
    { "x-app-submit-proof-batcher": AppSubmitProofToBatcher },
    {attributes: ["network"] }
);
