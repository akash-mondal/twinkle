# ✨ Twinkle SDK: The Universal MNEE Adoption Engine

> **Powering Agentic Commerce with Gasless MNEE Settlement & Native Monetization.**

Twinkle is an Institutional-Grade SDK for the **x402 (Payment Required)** ecosystem. It provides AI agents with the ability to discover, negotiate, and settle payments gaslessly using **MNEE** (The Agentic Stablecoin), while offering a seamless "Universal Bridge" for legacy USDC users.

---

## 🏛️ Institutional Architecture

![Twinkle Architecture](https://www.plantuml.com/plantuml/svg/TLHjRzem4FxkNt5ZcWJQsWBhj2qIMnc4jbgPMA7h5wJ994UmSEpKSMYHzkDtTf8sfHjVWFYvk-VbdBFSScEBLB9NTeCfGYQvK2pV2fLnmrDOyMYR65seUAIbDl1wuZyDHBxXiRuNAe4rbpasJdnPf8r20xrkus16CqKaCgxijnVzFqq-JuODy32oslmFnZR8Osg_809RYG7SAB53atC9qnzX2CDOPrPe1Q5AX4AsrjeIVDSxxXvtuGyC4rH41KOwJT5423EZhOwqP8oxkT0QNfQW5l2y_CMo9_hGgYR3VFnzgTeZAGZHyM1wyXnwYokOezc920dwSDhjmpct65TmEa7pl6A69XMslrGZhQmXHXvPFVqdZwMQy4X8OJcnz-Z6VnPporSyHsY55BV18bsgAGMkiEmyshZqsM00ius3zGBAQf-I91YBFD94S0-30VC-mD4Nfp60DTfeqpQOwu8i_5qOsM5quC-zg00k5eiPd8SBLZvuB7KUr1EkyQuG1cFoncT7xj_CnoCe8-uqQFMRENyp8auGsdNK7KUm7kzcN2hheiqiN672eprS-8PCqIg04Sd64cPTpehHOaIHl5igr-Ak84mEKv4OxjVe5vS5rjsz2u5RcJIZxzRyNf0HO7MvUsiIS8qhIlXhwy2nkKXKxYUUU6YTw9F4zm7jHYunpwc7vFk6g4QWPIUClKRg_nQcQBbBcJLGBuf-Ebaml-SPjBri0ZWUdSCglmy1X0yO5LIHUPgtmYhYjJ1SvMiq4vBFFD1LL4e2vvGW8WZXvUpeOw_lcN9R66GLfZ5WZjRI7IfpF_76DFC-3M1eTKhtj0JwTI537gVMQqPHx8Hx7zGxrIvbFGAVsV3X3Onn1nCaBp9wUgY-ohSQVQNtNDfz5MdT-Q34fqkNTIrCMcuCCP6QnmSxSwEaZhOKt7LrQroHYv2nCrInUo7_1G00)

---

## ⚡ Key Advantages

| Feature          | Twinkle (MNEE)                    | Traditional (USDC)          |
| :--------------- | :-------------------------------- | :-------------------------- |
| **Gas Cost**     | **Gasless** (Facilitator Covered) | Heavy (Approval + Transfer) |
| **UX Flow**      | **Atomic** (Signature only)       | Complex (Multi-step)        |
| **Monetization** | **Native 5% Dev Fee**             | Manual/Social Layer         |
| **Onboarding**   | **Instant Bridge** (USDC/MNEE)    | Friction-Heavy              |
| **Loyalty**      | **Automated Rebates**             | None                        |

---

## 🔗 The Universal Bridge (Swap-Relay)

Twinkle features a first-of-its-kind **Universal Bridge** that captures legacy USDC traffic and settles natively in MNEE. When a service provider requests USDC, the SDK provides the agent with a "Migration Quote"—showing the gas savings and loyalty rebates gained by switching to MNEE.

### The Swap-Relay Sequence

```mermaid
sequenceDiagram
    participant Agent as AI Agent (USDC Only)
    participant SDK as Twinkle SDK
    participant Fac as Facilitator
    participant DEX as Uniswap V3
    participant Provider as Provider (MNEE)

    SDK->>Agent: "Detected USDC request. Switch for $2.50 savings?"
    Agent->>SDK: Signs USDC Permit2 Intent
    SDK->>Fac: Signed Intent + Conversion Meta
    Fac->>Fac: Pull USDC via Permit2
    Fac->>DEX: Atomic Swap (USDC -> MNEE)
    Fac->>Provider: Settle MNEE Payment
    Fac->>Agent: Send MNEE Rebate (Adoption Reward)
```

---

## 🛠️ Implementation Guide

### 1. Build the Agent

Initialize the `TwinkleAgent` with your developer address to start earning 5% fees automatically.

```typescript
const agent = new TwinkleAgent({
  privateKey: process.env.AGENT_KEY,
  developerAddress: "0xYourDevWallet",
  autoSwitch: true, // Enable the Adoption Engine
});
```

### 2. Settle Gaslessly

Simply call any x402-enabled API. The SDK handles the 402 redirects and Permit2 signing.

```typescript
const result = await agent.fetch("https://premium-agent-service.com/api");
```

### 3. Deploy the Server

Gate your AI services with the `TwinkleServer` middleware.

```typescript
app.get("/api/resource", twinkleServer.middleware(), (req, res) => {
  res.json({ message: "Content Unlocked via Gasless MNEE" });
});
```

---

## 💎 Developer Monetization

Twinkle enforces a native **5% developer fee split** on all transactions.

- **Provider**: Receives 95% of the service price.
- **Developer**: Receives 5% royalty for building the agent/integration.
- **Agent**: Receives a gasless experience + optional loyalty rebates.

---

## 📜 License & Ecosystem

Built for the **x402 Protocol** and the **MNEE Ecosystem**.
ISC License | Powered by Twinkle Facilitators
