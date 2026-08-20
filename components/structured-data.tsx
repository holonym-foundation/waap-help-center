import type { ReactElement } from 'react'

// Renders a Schema.org JSON-LD block, server-rendered so AI and search
// crawlers can parse it. Used from the MDX content pages.
function JsonLd({ data }: { data: Record<string, unknown> }): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// FAQPage schema for /faq. Mirrors the questions and answers on the page;
// keep both in sync when the FAQ copy changes.
export function FaqJsonLd(): ReactElement {
  const qa: [string, string][] = [
    [
      'What is WaaP?',
      `WaaP (Wallet as a Protocol) is a self-custodial wallet that doesn't require seed phrases. It uses two-party computation to split your keys between your device and a secure enclave, so no single party can access your funds.`,
    ],
    [
      'Is WaaP free?',
      `WaaP is free for end users; you only pay network gas fees. For developers it's free to integrate, with a revenue-share model (no per-seat or per-signature billing). Agent and CLI usage may have separate pricing; check waap.xyz for current details.`,
    ],
    [
      'What chains does WaaP support?',
      `EVM chains (Ethereum, Optimism, Base, Arbitrum, Polygon, and more), Sui, and Stellar (as a signer). Solana support is planned.`,
    ],
    [
      'Where are my keys stored?',
      `Your keys are split into two shares: one on your device (derived from your login) and one on the decentralized WaaP network. Neither share alone can sign transactions.`,
    ],
    [
      'What if I lose my phone?',
      `You can recover access using any login method you've set up (email, phone, Google, etc.). We recommend setting up multiple methods.`,
    ],
    [
      'Can WaaP access my funds?',
      `No. WaaP only holds one share of your key. Without your share, no one, including WaaP, can move your funds.`,
    ],
    [
      'How do I back up my wallet?',
      `You don't need to. Your wallet is tied to your login credentials; as long as you can log in, you have access.`,
    ],
    [
      'Can I use WaaP with hardware wallets?',
      `WaaP is designed to provide hardware-wallet-level security without a physical device. Hardware wallet integration is not currently supported.`,
    ],
    [
      'How do I export my keys?',
      `Key export is available for users who need it; it generates a standard private key you can import elsewhere. Once exported, your security model changes to a traditional single-key setup.`,
    ],
    [
      'Can my WaaP wallet be used by AI agents?',
      `Yes. WaaP provides a headless CLI (@human.tech/waap-cli) for AI agents and scripts. Agents sign up with email and password, get a standard wallet address, and can send transactions, sign messages, and query balances from the command line.`,
    ],
    [
      'Should I give my agent a Privilege, or its own wallet?',
      `A Privilege grant lets your agent use your wallet with scoped, time-limited access — best for personal agents acting on your behalf. An own wallet via the CLI gives the agent its own address and balance — best for autonomous services. You can combine both: an agent with its own wallet can also receive Privileges from other users.`,
    ],
    [
      'How do I control what my agent can do?',
      `WaaP has a layered security model: Policies (daily spend limits and auto-approve rules), 2FA (high-risk transactions require approval via Telegram, email, phone, or hardware wallet), and Privileges (scoped, time-limited tokens, max 2 hours, that let an agent bypass 2FA for pre-approved operations). New accounts start with 2FA disabled.`,
    ],
    [
      'What is a Privilege?',
      `A Privilege is a scoped, time-bounded token that lets an agent or dApp bypass 2FA for specific operations. You define the allowed addresses, chain, spend limit, and duration (max 2 hours, enforced server-side). If 2FA is disabled, Privileges are unnecessary.`,
    ],
    [
      `How do I approve or revoke my agent's access?`,
      `Approve via your chosen 2FA method (Telegram, email, phone, or hardware wallet) when an agent exceeds your policy limits. Revoke by changing the account password or adjusting policies with waap-cli; Privileges expire automatically after their duration. To shut down, run waap-cli logout or change the password to invalidate all sessions.`,
    ],
    [
      'What happens if my agent gets compromised?',
      `WaaP's 2PC architecture means a compromised agent alone can't drain your funds — it only holds one key share. Transaction scanning catches malicious payloads before signing, 2FA blocks unexpected transactions, Privileges auto-expire after at most 2 hours, and policy limits cap possible damage. If you suspect a compromise, set your daily limit to 0 and change the account password.`,
    ],
    [
      'Can I run multiple agents on one WaaP wallet?',
      `Yes. Each agent session is independent. Use email + notation (e.g., you+agent1@email.com) to create separate agent accounts, each with its own wallet, policies, and session. Revoking one agent does not affect others.`,
    ],
    [
      'How is WaaP different from other agent wallets?',
      `Most agent wallets are either fully custodial (the platform holds your keys) or fully autonomous (the agent has unrestricted access). WaaP uses 2PC so you always hold a key share, Privileges for scoped permissions, and conversational approval via Telegram or email. It's a protocol, not a platform — no vendor lock-in.`,
    ],
    [
      'What frameworks and tools can I use with WaaP?',
      `The WaaP CLI is framework-agnostic. Any agent framework that can execute shell commands (e.g., LangChain, CrewAI, AutoGPT, ElizaOS) can use waap-cli for wallet operations.`,
    ],
  ]

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: qa.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      }}
    />
  )
}

// HowTo schema for /getting-started (the genuinely step-by-step page).
export function GettingStartedJsonLd(): ReactElement {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to create a WaaP wallet',
        description:
          'Set up a self-custodial WaaP wallet, with no seed phrase, in minutes.',
        step: [
          {
            '@type': 'HowToStep',
            name: 'Open the app',
            text: 'Visit an app where WaaP is integrated.',
          },
          {
            '@type': 'HowToStep',
            name: 'Start sign-in',
            text: 'Click Connect or Sign In.',
          },
          {
            '@type': 'HowToStep',
            name: 'Choose a login method',
            text: 'Sign in with email, phone, Google, or Apple.',
          },
          {
            '@type': 'HowToStep',
            name: 'Verify',
            text: 'Complete verification.',
          },
          {
            '@type': 'HowToStep',
            name: 'Done',
            text: 'Your self-custodial wallet is ready, with no seed phrase to manage.',
          },
        ],
      }}
    />
  )
}
