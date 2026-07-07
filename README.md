<div align="center">
  <h1>✨ PortfolioChat</h1>
  <p><em>Turn your static documents and websites into a living, breathing AI assistant.</em></p>
</div>

---

## 🎯 What is this?

**PortfolioChat** is a platform that lets you create a custom, AI-powered chatbot trained exclusively on your own data. Whether you want an AI to represent your personal portfolio, answer questions about your resume, or act as a guide for your website, PortfolioChat makes it effortless. You simply upload your content, customize your bot, and embed it anywhere.

## 💡 Why does it exist?

Static websites, PDF resumes, and traditional portfolios are one-way streets—visitors have to dig to find what they care about. We built PortfolioChat to change that. 

Instead of forcing recruiters, clients, or visitors to read through pages of text, they can simply **talk to your data**. It bridges the gap between static content and interactive, engaging experiences, giving everyone a personalized concierge that knows everything about your work.

## 🚀 What can it do?

- **📚 Absorb Anything:** Upload PDFs, type manual text entries, or just paste a website/GitHub URL. The AI instantly reads and learns your content.
- **🎨 Beautiful Customization:** Use our split-screen studio to design a widget that matches your brand. Tweak themes, colors, launcher styles, and even the AI's personality (from *Professional* to *Enthusiastic*).
- **🔌 Drop-in Embedding:** Add the chatbot to any website in seconds by pasting a single `<script>` tag. No coding required.
- **💬 Conversation Tracking:** A full dashboard lets you see exactly what visitors are asking, allowing you to refine your knowledge base over time.
- **🤖 Headless API:** For developers, we offer a standalone API so you can build entirely custom chat interfaces powered by your data.

## ✨ Key Features

- **🎨 Customizable Widget**: Design an embeddable chat interface that matches your branding perfectly.
- **📄 PDF Embedding**: Upload your resume, docs, or PDFs and let the AI automatically index them.
- **🧠 Knowledge Base**: Type in raw text or structured notes to create a custom brain for your bot.
- **🕸️ Website Scraping**: Point the platform at a URL and watch it absorb the content instantly.
- **🐙 GitHub README Integration**: Import your public GitHub repositories directly into your knowledge base.
- **⚙️ Model Configurations**: Tweak the AI's personality, tone, language, and creativity parameters.
- **🔄 Model Fallbacks**: Built-in redundancy seamlessly cascades through different LLMs if one provider fails or rate-limits.
- **🔒 Hashed One-Time Keys**: Enterprise-grade security for your developer API with zero-hint secret keys and safe database hashing.

## ⚙️ How does it work?

It's surprisingly simple from the user's perspective:
1. **Upload:** You provide your files, text, or URLs.
2. **Process:** Behind the scenes, we chop your content into tiny, easily digestible pieces and convert them into mathematical "embeddings" that the AI understands.
3. **Chat:** When a visitor asks a question, our system instantly searches your unique knowledge base for the most relevant pieces of information, and the AI uses that exact context to craft a perfectly accurate answer.

## 💻 How do I run it?

If you are a user, there's nothing to install—just sign in to the dashboard, configure your bot, and embed the script!

If you are a developer looking to run the platform locally:
1. Clone this repository.
2. Copy the `.env.local` variables (you'll need API keys for your Database, Auth, and LLM providers).
3. Run the development server (using your package manager, e.g., `npm run dev` or `pnpm dev`).
4. Access the Dashboard and API locally to start building!

## 🔮 What's next?

We're constantly working on making the AI faster, smarter, and more customizable. Jump into the dashboard, create your first project, and bring your portfolio to life! 
