import type { McqQuestion } from '../../types';

/**
 * Lala-company round: basics, office IT, and spotting red flags —
 * the questions are funny, the lessons are not.
 */
export const JHA2_QUESTIONS: McqQuestion[] = [
  // ---------------------------------------------------------------- tier 0
  {
    id: 'j-0a',
    tier: 0,
    q: 'Jha ji: “Beta, first basic question. Full form of HTML?”',
    options: [
      'High Tech Modern Language',
      'HyperText Markup Language',
      'Hyperlink and Text Management Language',
      'Home Tool Markup Language',
    ],
    answer: 1,
    why: 'HTML structures web content; CSS styles it and JavaScript adds behaviour. Jha ji’s nephew thinks HTML is a programming language. It isn’t.',
  },
  {
    id: 'j-0b',
    tier: 0,
    q: 'Jha ji: “Which shortcut is for undo? I keep deleting the GST file.”',
    options: ['Ctrl + U', 'Ctrl + Y', 'Ctrl + Z', 'Alt + F4'],
    answer: 2,
    why: 'Ctrl + Z undoes, Ctrl + Y redoes in most Windows apps, Ctrl + U underlines. Alt + F4 closes the window — do not demonstrate it on Jha ji’s GST file.',
  },
  {
    id: 'j-0c',
    tier: 0,
    q: 'Jha ji: “Java and JavaScript are same only, na? Script version of Java?”',
    options: [
      'Yes, JavaScript is compiled Java',
      'Yes, it’s Java for browsers',
      'No, JavaScript is a coffee brand',
      'No — they’re different languages; the similar name was mostly marketing',
    ],
    answer: 3,
    why: 'Java is statically typed and runs on the JVM; JavaScript is dynamically typed and runs in browsers and Node.js. Netscape picked the name in 1995 to ride Java’s hype.',
  },
  // ---------------------------------------------------------------- tier 1
  {
    id: 'j-1a',
    tier: 1,
    q: 'Jha ji: “Our company website is on WordPress. WordPress is made in which language?”',
    options: ['Java', 'Kotlin', 'C++', 'PHP'],
    answer: 3,
    why: 'WordPress is written in PHP and usually runs on MySQL or MariaDB. It powers a huge share of the web — which is why every lala-company job description says “Java/PHP”.',
  },
  {
    id: 'j-1b',
    tier: 1,
    q: 'Jha ji: “Excel mein total nikalna hai. Which formula adds cells A1 to A10?”',
    options: ['=SUM(A1:A10)', '=ADD(A1:A10)', '=TOTAL(A1,A10)', '=A1+A10'],
    answer: 0,
    why: 'SUM over the range A1:A10 adds all ten cells. =A1+A10 adds only two cells, and ADD/TOTAL aren’t standard Excel functions. Being good at Excel is a genuine office superpower.',
  },
  {
    id: 'j-1c',
    tier: 1,
    q: 'Jha ji: “You will also handle our domain. What does DNS do?”',
    options: [
      'Makes the internet faster',
      'Stores all our emails',
      'Translates domain names like jha2infotech.com into IP addresses',
      'Encrypts our passwords',
    ],
    answer: 2,
    why: 'DNS is the internet’s phone book: it resolves names to IP addresses. When the site “disappears” right after someone forgot to renew the domain, this is where you look first.',
  },
  // ---------------------------------------------------------------- tier 2
  {
    id: 'j-2a',
    tier: 2,
    q: 'Jha ji: “Client is asking why our site shows ‘Not Secure’. What is the difference between HTTP and HTTPS?”',
    options: [
      'HTTPS is always faster',
      'HTTPS encrypts traffic using TLS, protecting data in transit',
      'HTTPS only works on mobile',
      'There is no difference',
    ],
    answer: 1,
    why: 'HTTPS wraps HTTP in TLS, so passwords and form data can’t be read or altered in transit. Certificates are free with Let’s Encrypt — there’s no excuse for the “Not Secure” badge.',
  },
  {
    id: 'j-2b',
    tier: 2,
    q: 'Jha ji’s nephew: “Git is that GitHub website only, right?”',
    options: [
      'Git is a version-control tool; GitHub is a service that hosts Git repositories',
      'Yes, both are the same',
      'Git is GitHub’s mobile app',
      'GitHub is Git’s antivirus',
    ],
    answer: 0,
    why: 'Git runs locally and tracks history with commits and branches. GitHub, GitLab and Bitbucket host Git repositories and add pull requests, issues and CI on top.',
  },
  {
    id: 'j-2c',
    tier: 2,
    q: 'Jha ji: “Client’s database stores user passwords as plain text. Problem kya hai?”',
    options: [
      'No problem if the database itself has a password',
      'Just encode them in Base64',
      'MD5 them, that’s enough',
      'Big problem — hash them with a slow, salted algorithm like bcrypt or Argon2',
    ],
    answer: 3,
    why: 'One leak exposes every user’s password, and people reuse passwords everywhere. Base64 is encoding, not security, and MD5 is far too fast to resist cracking. Use bcrypt, scrypt or Argon2.',
  },
  // ---------------------------------------------------------------- tier 3
  {
    id: 'j-3a',
    tier: 3,
    q: 'The nephew wrote this login check. What is the biggest problem?',
    code: `String sql = "SELECT * FROM users WHERE name = '" + name
           + "' AND pass = '" + pass + "'";`,
    options: [
      'It is a bit slow',
      'It’s wide open to SQL injection — use a PreparedStatement with parameters',
      'It’s missing a semicolon',
      'It should SELECT name instead of *',
    ],
    answer: 1,
    why: "Typing ' OR '1'='1 as the input turns the WHERE clause into something always true and logs anyone in. Parameterised queries send data separately from SQL, so input can never become code.",
  },
  {
    id: 'j-3b',
    tier: 3,
    q: 'Jha ji: “Submit your original marksheets to us for the bond period, okay?” What’s the right response?',
    options: [
      'Submit happily — we’re a family',
      'Submit them and pay a security deposit too',
      'Politely decline and offer self-attested copies for verification',
      'Submit your parents’ certificates as well',
    ],
    answer: 2,
    why: 'Holding originals is a pressure tactic that makes leaving very hard — a major red flag. Verification needs copies and a background check, not your only proof of education.',
  },
  {
    id: 'j-3c',
    tier: 3,
    q: 'Jha ji: “Salary we will give in cash. No payslip, no PF, simple system.” What’s the smart response?',
    options: [
      'Great — cash is king',
      'Accept, and ask for gold instead of a hike',
      'Accept, and also pay his taxes for him',
      'Push back: without payslips and PF you have no proof of employment or statutory benefits',
    ],
    answer: 3,
    why: 'Payslips, PF and bank transfers prove your work history for background checks, loans and visas — and PF is your retirement money. Cash-only with no records is a classic red flag.',
  },
  // ---------------------------------------------------------------- tier 4
  {
    id: 'j-4a',
    tier: 4,
    q: 'The nephew pushed the database password to a public GitHub repo, then deleted the file in a new commit. Why is that not enough?',
    options: [
      'GitHub hides passwords automatically',
      'Deleting the file erases it from every clone',
      'The password is still in Git history and may already be scraped — rotate it immediately',
      'Private browsing removes it from GitHub',
    ],
    answer: 2,
    why: 'Git keeps every version: anyone can check out the old commit, and bots scan public repos for secrets within minutes. Rotate the credential first, then clean history — and keep secrets in environment variables or a vault.',
  },
  {
    id: 'j-4b',
    tier: 4,
    q: 'Jha ji: “The bond says if you leave before 2 years, you pay ₹2 lakh.” Before signing, what’s the smartest move?',
    options: [
      'Read the full clause, get terms in writing, check the penalty is proportionate, and ask someone you trust',
      'Sign immediately — good offers vanish',
      'Sign with a fake name',
      'Offer to make it ₹3 lakh to look committed',
    ],
    answer: 0,
    why: 'Bonds can be reasonable when tied to real training costs, but a large flat penalty is a lock-in. Never sign under time pressure; understand exactly what triggers the penalty and get advice if unsure.',
  },
  {
    id: 'j-4c',
    tier: 4,
    q: 'Jha ji: “Server is slow, nephew says buy a new one.” You find the app opens a new DB connection per request and never closes it. Best fix?',
    options: [
      'Buy the bigger server anyway',
      'Restart the server every hour with a cron job',
      'Add more RAM to the database',
      'Use a connection pool such as HikariCP and close resources with try-with-resources',
    ],
    answer: 3,
    why: 'Opening connections is expensive, and leaked ones exhaust the database’s connection limit until everything hangs. A pool reuses a fixed set of connections; try-with-resources guarantees they go back to it.',
  },
];
