const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

async function handleJsonResponse(response, fallbackMessage) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || fallbackMessage);
  }

  return data;
}

// ------------------------------------
// FRAGMENT TOKEN
// ------------------------------------

export async function fragmentToken(
  service,
  environment,
  owner,
  token
) {
  const response = await fetch(
    `${API_URL}/fragment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service,
        environment,
        owner,
        token,
      }),
    }
  );

  return handleJsonResponse(
    response,
    "Unable to fragment token."
  );
}

// ------------------------------------
// LIVE XOR VISUALIZATION
// NO STORAGE
// ------------------------------------

export async function visualizeXOR(secret) {
  const response = await fetch(
    `${API_URL}/visualize-xor`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service: "Visualization",
        environment: "Demo",
        owner: "XOR Lab",
        token: secret,
      }),
    }
  );

  return handleJsonResponse(
    response,
    "Unable to generate XOR visualization."
  );
}

// ------------------------------------
// VAULT STATUS
// ------------------------------------

export async function getVaultStatus() {
  const response = await fetch(
    `${API_URL}/vault-status`
  );

  return handleJsonResponse(
    response,
    "Unable to retrieve vault status."
  );
}

// ------------------------------------
// SECRET INVENTORY
// ------------------------------------

export async function getSecretInventory() {
  const response = await fetch(
    `${API_URL}/secret-inventory`
  );

  return handleJsonResponse(
    response,
    "Unable to retrieve secret inventory."
  );
}

// ------------------------------------
// RECONSTRUCT SECRET
// ------------------------------------

export async function reconstructSecret(fileId) {
  const response = await fetch(
    `${API_URL}/reconstruct/${fileId}`
  );

  return handleJsonResponse(
    response,
    "Unable to reconstruct secret."
  );
}

// ------------------------------------
// SECRET INTEGRITY STATUS
// ------------------------------------

export async function getSecretIntegrityStatus(fileId) {
  const response = await fetch(
    `${API_URL}/integrity-status/${fileId}`
  );

  return handleJsonResponse(
    response,
    "Unable to retrieve secret integrity status."
  );
}

// ------------------------------------
// STATISTICS
// ------------------------------------

export async function getStatistics() {
  const response = await fetch(
    `${API_URL}/statistics`
  );

  return handleJsonResponse(
    response,
    "Unable to retrieve statistics."
  );
}

// ====================================
// ATTACK DEMO STATUS
// ====================================

export async function getAttackDemoStatus() {
  const response = await fetch(
    `${API_URL}/attack-demo/status`
  );

  return handleJsonResponse(
    response,
    "Unable to retrieve attack demo status."
  );
}

// ====================================
// RESET ATTACK DEMO
// ====================================

export async function resetAttackDemo() {
  const response = await fetch(
    `${API_URL}/attack-demo/reset`,
    {
      method: "POST",
    }
  );

  return handleJsonResponse(
    response,
    "Unable to reset attack demo."
  );
}

// ====================================
// COMPROMISE VAULT
// ====================================

export async function compromiseVault(vaultName) {
  const response = await fetch(
    `${API_URL}/attack-demo/compromise-vault/${vaultName}`,
    {
      method: "POST",
    }
  );

  return handleJsonResponse(
    response,
    "Unable to compromise vault."
  );
}

// ====================================
// INTERCEPT FRAGMENT
// ====================================

export async function interceptFragment(vaultName) {
  const response = await fetch(
    `${API_URL}/attack-demo/intercept-fragment/${vaultName}`,
    {
      method: "POST",
    }
  );

  return handleJsonResponse(
    response,
    "Unable to intercept fragment."
  );
}

// ====================================
// FULL FRAGMENT COMPROMISE
// ====================================

export async function fullFragmentCompromise() {
  const response = await fetch(
    `${API_URL}/attack-demo/full-fragment-compromise`,
    {
      method: "POST",
    }
  );

  return handleJsonResponse(
    response,
    "Unable to simulate full fragment compromise."
  );
}