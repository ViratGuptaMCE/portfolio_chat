"use client";

import React, { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "../../../../lib/auth-client";
import { getProjectById } from "../../actions";
import { useRouter } from "next/navigation";

if (typeof window !== "undefined") {
  import("@material/web/icon/icon.js");
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.5 } }
};

export default function ProjectOverviewPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { projectId } = unwrappedParams;
  const { data: session } = useSession();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadProject() {
      if (session?.user?.id) {
        setLoading(true);
        const data = await getProjectById(session.user.id, projectId);
        if (data) {
          setProject(data);
        } else {
          // If project not found or unauthorized
          router.push('/dashboard');
        }
        setLoading(false);
      }
    }
    loadProject();
  }, [session?.user?.id, projectId, router]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-secondary">
        <div className="w-6 h-6 rounded-full border-2 border-accent-indigo border-t-transparent animate-spin" />
        <p className="text-sm font-mono uppercase tracking-widest">Loading Project Details...</p>
      </div>
    );
  }

  if (!project) return null;

  const scriptTag = `<script 
  src="https://cdn.portfoliochat.dev/widget.js" 
  data-token="${project.widgetToken}" 
  defer
></script>`;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
      
      {/* Quick Stats */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Status", value: project.status === 'ready' ? 'Active' : 'Processing', icon: "check_circle", color: "text-accent-emerald" },
          { label: "Embedding Model", value: project.embeddingModel, icon: "model_training", color: "text-accent-purple" },
          { label: "LLM Provider", value: project.llmModel, icon: "psychology", color: "text-accent-indigo" }
        ].map((stat, i) => (
          <div key={i} className="bg-surface-glass backdrop-blur-md border border-surface-border rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className={`w-10 h-10 rounded-xl bg-surface-border/50 flex items-center justify-center ${stat.color}`}>
              <md-icon>{stat.icon}</md-icon>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-text-tertiary font-mono uppercase tracking-widest">{stat.label}</span>
              <span className="text-base font-medium text-text-primary mt-1">{stat.value}</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Integration Section */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Widget Integration */}
        <div className="bg-surface-glass backdrop-blur-xl border border-surface-border rounded-3xl p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-indigo/10 blur-[100px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <md-icon className="text-accent-indigo">web</md-icon>
              Widget Integration
            </h2>
            <p className="text-sm text-text-secondary">Embed this script right before the closing <code className="font-mono text-xs bg-surface-border px-1.5 py-0.5 rounded text-accent-indigo">&lt;/body&gt;</code> tag on your website.</p>
          </div>

          <div className="relative group mt-2">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-indigo/20 to-accent-purple/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative bg-[#0d0d12] border border-surface-border-strong rounded-xl p-4 overflow-hidden">
              <pre className="font-mono text-[13px] text-text-secondary overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                <span className="text-accent-pink">&lt;script</span>{'\n'}
                {'  '}src=<span className="text-accent-emerald">"https://cdn.portfoliochat.dev/widget.js"</span>{'\n'}
                {'  '}data-token=<span className="text-accent-emerald">"{project.widgetToken}"</span>{'\n'}
                {'  '}<span className="text-accent-pink">defer</span>{'\n'}
                <span className="text-accent-pink">&gt;&lt;/script&gt;</span>
              </pre>
              <button 
                onClick={() => copyToClipboard(scriptTag)}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-surface-glass border border-surface-border flex items-center justify-center hover:bg-surface-border/80 text-text-secondary hover:text-white transition-all active:scale-95"
                title="Copy Script"
              >
                <md-icon style={{ fontSize: 16 }}>{copied ? 'check' : 'content_copy'}</md-icon>
              </button>
            </div>
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-surface-glass backdrop-blur-xl border border-surface-border rounded-3xl p-8 flex flex-col gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/10 blur-[100px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <md-icon className="text-accent-purple">api</md-icon>
              API Credentials
            </h2>
            <p className="text-sm text-text-secondary">Use your project slug and widget token to interact with the PortfolioChat REST API securely from your own backend.</p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">Project Slug</label>
              <div className="bg-bg-elevated border border-surface-border rounded-lg px-4 py-3 font-mono text-sm text-text-primary flex items-center justify-between">
                {project.slug}
                <button onClick={() => copyToClipboard(project.slug)} className="text-text-tertiary hover:text-white transition-colors">
                  <md-icon style={{ fontSize: 16 }}>content_copy</md-icon>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">API / Widget Token</label>
              <div className="bg-bg-elevated border border-surface-border rounded-lg px-4 py-3 font-mono text-sm text-text-primary flex items-center justify-between">
                ••••••••••••••••••••••••••••
                <button onClick={() => copyToClipboard(project.widgetToken)} className="text-text-tertiary hover:text-white transition-colors">
                  <md-icon style={{ fontSize: 16 }}>content_copy</md-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}
