"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

if (typeof window !== "undefined") {
  import("@material/web/button/filled-button.js");
  import("@material/web/button/outlined-button.js");
  import("@material/web/icon/icon.js");
}

// Stagger animation container
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.4 } }
};

export default function DashboardPage() {
  // We'll mock the projects for the scaffolding phase. 
  // Next step: Fetch from our API or Drizzle DB directly via Server Actions.
  const [projects, setProjects] = useState([
    { id: "1", name: "Personal Resume Bot", status: "active", docsCount: 3 },
    { id: "2", name: "Blog Q&A", status: "training", docsCount: 15 }
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display-small font-medium text-on-background">Your Projects</h1>
          <p className="text-body-large text-on-surface-variant mt-1">Manage your trained AI widgets</p>
        </div>
        <md-filled-button>
          <md-icon slot="icon">add</md-icon>
          Create Project
        </md-filled-button>
      </header>

      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {projects.map((project) => (
          <motion.article 
            key={project.id}
            variants={item}
            className="bg-surface-container-high rounded-3xl p-6 flex flex-col gap-4 border border-outline-variant/20 hover:border-outline-variant/60 transition-colors"
          >
            <header className="flex justify-between items-start">
              <h2 className="text-title-large font-medium text-on-surface">{project.name}</h2>
              <div className={`px-2 py-1 rounded-full text-label-small uppercase font-bold tracking-wider ${
                project.status === 'active' 
                  ? 'bg-primary-container text-on-primary-container' 
                  : 'bg-surface-variant text-on-surface-variant'
              }`}>
                {project.status}
              </div>
            </header>

            <div className="flex-1 text-body-medium text-on-surface-variant">
              {project.docsCount} document{project.docsCount !== 1 && 's'} indexed
            </div>

            <footer className="flex justify-end gap-2 mt-4">
              <md-outlined-button onClick={() => window.location.href = `/dashboard/projects/${project.id}`}>
                Manage
              </md-outlined-button>
            </footer>
          </motion.article>
        ))}

        {/* Empty state / Add New Card */}
        <motion.article 
          variants={item}
          className="bg-surface-container rounded-3xl p-6 flex flex-col items-center justify-center gap-2 border border-dashed border-outline-variant/50 hover:border-outline cursor-pointer transition-colors min-h-[200px]"
          onClick={() => alert("Create project dialog would open here!")}
        >
          <md-icon style={{ fontSize: 32, color: 'var(--md-sys-color-primary)' }}>add_circle</md-icon>
          <h3 className="text-title-medium font-medium mt-2">New Widget</h3>
          <p className="text-body-small text-on-surface-variant text-center">Start a new chatbot project</p>
        </motion.article>
      </motion.div>
    </div>
  );
}
