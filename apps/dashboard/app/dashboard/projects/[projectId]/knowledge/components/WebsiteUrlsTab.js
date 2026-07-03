"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { fetchGithubRepos, fetchGithubReadme } from "../../../actions";
import { fetchGithubRepos , fetchGithubReadme } from "@/app/dashboard/actions";

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { ease: [0.23, 1, 0.32, 1], duration: 0.4 } }
};

export default function WebsiteUrlsTab({
  websites,
  loading,
  isScraping,
  handleAddWebsite,
  setSelectedDocForView,
  setDeleteConfirmItem
}) {
  // Mode: 'url' | 'github'
  const [subMode, setSubMode] = useState("url");

  // Website URL Form State
  const [urlInput, setUrlInput] = useState("");

  // GitHub Username Form & Search State
  const [githubUser, setGithubUser] = useState("");
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [fetchedGithubData, setFetchedGithubData] = useState(null); // { username, repos }
  const [githubError, setGithubError] = useState(null);
  const [repoFilter, setRepoFilter] = useState("");

  // GitHub README Modal State
  const [selectedRepoForReadme, setSelectedRepoForReadme] = useState(null); // repo object
  const [isFetchingReadme, setIsFetchingReadme] = useState(false);
  const [readmeData, setReadmeData] = useState(null); // { content, repoUrl }
  const [readmeError, setReadmeError] = useState(null);
  const [isSavingData, setIsSavingData] = useState(false);

  // Handlers for Website URL
  const onSubmitUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    handleAddWebsite(urlInput);
    setUrlInput("");
  };

  // Handlers for GitHub Repos
  const handleFetchGithubRepos = async (e) => {
    if (e) e.preventDefault();
    if (!githubUser.trim()) return;

    setIsFetchingRepos(true);
    setGithubError(null);
    setFetchedGithubData(null);

    const res = await fetchGithubRepos(githubUser);
    if (res.success) {
      setFetchedGithubData(res);
    } else {
      setGithubError(res.error || "Failed to fetch GitHub repositories");
    }
    setIsFetchingRepos(false);
  };

  const handleOpenRepoReadme = async (repo) => {
    setSelectedRepoForReadme(repo);
    setIsFetchingReadme(true);
    setReadmeError(null);
    setReadmeData(null);

    const res = await fetchGithubReadme(fetchedGithubData.username, repo.name, repo.defaultBranch);
    if (res.success) {
      setReadmeData(res);
    } else {
      setReadmeError(res.error || "Could not fetch README.md for this repository.");
    }
    setIsFetchingReadme(false);
  };

  const handleSaveReadmeData = async () => {
    if (!selectedRepoForReadme || !readmeData || !readmeData.content) return;

    setIsSavingData(true);
    const repoTitle = `GitHub: ${selectedRepoForReadme.fullName} (README.md)`;
    const repoUrl = readmeData.repoUrl || selectedRepoForReadme.htmlUrl;

    await handleAddWebsite(repoUrl, repoTitle, readmeData.content);

    setIsSavingData(false);
    setSelectedRepoForReadme(null);
    setReadmeData(null);
  };

  const filteredRepos = fetchedGithubData?.repos?.filter((r) => {
    if (!repoFilter.trim()) return true;
    const query = repoFilter.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      (r.description && r.description.toLowerCase().includes(query)) ||
      (r.language && r.language.toLowerCase().includes(query))
    );
  }) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6"
    >
      {/* Sub-mode Toggle Pill Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111] p-2 rounded-2xl border border-[#e5e5e5] dark:border-[#222]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSubMode("url")}
            className={`relative px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
              subMode === "url"
                ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                : "text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">language</span>
            <span>Website URL Crawler</span>
          </button>

          <button
            type="button"
            onClick={() => setSubMode("github")}
            className={`relative px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
              subMode === "github"
                ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                : "text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">code</span>
            <span>GitHub Repositories</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-[#888] px-3 hidden sm:block">
          {subMode === "url" ? "Crawl public websites" : "Import GitHub README.md"}
        </div>
      </div>

      {/* Mode 1: Website URL Form */}
      {subMode === "url" && (
        <form
          onSubmit={onSubmitUrl}
          className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col gap-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-black dark:text-white">
                  language
                </span>
                Crawl & Index Website URL
              </h3>
              <p className="text-xs text-[#666] dark:text-[#888]">
                The ideal site for scraping is one that serves its content
                directly in the initial HTML response, without relying on loaders,
                JavaScript rendering, or scroll‑triggered events.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-portfolio-website.com"
              required
              className="flex-1 bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-4 py-3 outline-none focus:border-black dark:focus:border-white transition-colors text-sm font-mono"
            />
            <button
              type="submit"
              disabled={isScraping || !urlInput.trim()}
              className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isScraping ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white dark:border-black border-t-transparent animate-spin" />
                  <span>Crawling Website...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    travel_explore
                  </span>
                  <span>Crawl & Index URL</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Mode 2: GitHub Username Form & Repo Browser */}
      {subMode === "github" && (
        <div className="flex flex-col gap-6">
          <form
            onSubmit={handleFetchGithubRepos}
            className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col gap-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-black dark:text-white">
                    account_tree
                  </span>
                  Import GitHub Repositories
                </h3>
                <p className="text-xs text-[#666] dark:text-[#888]">
                  Enter a GitHub username to view all public repositories, inspect their README.md files, and save the data to vectorize it for your chatbot.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono text-[#888]">
                  @
                </span>
                <input
                  type="text"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                  placeholder="github-username (e.g. viratgupta or octocat)"
                  required
                  className="w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl pl-9 pr-4 py-3 outline-none focus:border-black dark:focus:border-white transition-colors text-sm font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isFetchingRepos || !githubUser.trim()}
                className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isFetchingRepos ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white dark:border-black border-t-transparent animate-spin" />
                    <span>Fetching Repos...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">
                      search
                    </span>
                    <span>Fetch Repositories</span>
                  </>
                )}
              </button>
            </div>

            {githubError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{githubError}</span>
              </div>
            )}
          </form>

          {/* Fetched GitHub Repositories Grid */}
          {fetchedGithubData && (
            <div className="bg-white dark:bg-[#111] p-6 rounded-[2rem] border border-[#e5e5e5] dark:border-[#222] flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#e5e5e5] dark:border-[#222]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-black dark:text-white">
                    folder_open
                  </span>
                  <h4 className="text-base font-semibold text-black dark:text-white">
                    Public Repositories for{" "}
                    <span className="font-mono text-black dark:text-white underline">
                      @{fetchedGithubData.username}
                    </span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f4f4f5] dark:bg-[#1f1f23] text-black dark:text-white text-xs font-mono font-semibold">
                    {fetchedGithubData.repos?.length || 0}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={repoFilter}
                    onChange={(e) => setRepoFilter(e.target.value)}
                    placeholder="Filter repositories..."
                    className="bg-[#fafafa] dark:bg-[#0a0a0a] text-black dark:text-white border border-[#e5e5e5] dark:border-[#333] rounded-xl px-3 py-1.5 text-xs outline-none focus:border-black dark:focus:border-white transition-colors font-mono w-full md:w-56"
                  />
                </div>
              </div>

              {filteredRepos.length === 0 ? (
                <div className="py-12 text-center text-[#888] text-xs font-mono">
                  No public repositories found matching your filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-4 rounded-2xl border border-[#e5e5e5] dark:border-[#222] bg-[#fafafa] dark:bg-[#09090b] flex flex-col justify-between gap-3 hover:border-black dark:hover:border-white transition-colors group"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-semibold text-black dark:text-white font-mono truncate">
                            {repo.name}
                          </h5>
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#888] hover:text-black dark:hover:text-white transition-colors shrink-0"
                            title="View on GitHub"
                          >
                            <span className="material-symbols-outlined text-base">
                              open_in_new
                            </span>
                          </a>
                        </div>
                        <p className="text-xs text-[#666] dark:text-[#888] line-clamp-2 leading-relaxed">
                          {repo.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5]/60 dark:border-[#1f1f23]">
                        <div className="flex items-center gap-3 text-[11px] font-mono text-[#888]">
                          {repo.language && (
                            <span className="px-2 py-0.5 rounded bg-[#eaeaea] dark:bg-[#1a1a1a] text-black dark:text-white font-semibold">
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-amber-500">
                              star
                            </span>
                            {repo.stars}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenRepoReadme(repo)}
                          className="bg-black dark:bg-white text-white dark:text-black rounded-lg px-3 py-1.5 text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">
                            visibility
                          </span>
                          <span>Fetch README</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* GitHub README Preview & Ingest Modal */}
      <AnimatePresence>
        {selectedRepoForReadme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#222] rounded-[2rem] p-6 w-full max-w-3xl shadow-2xl flex flex-col gap-4 max-h-[90vh]"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1 overflow-hidden">
                  <h3 className="text-lg font-semibold text-black dark:text-white truncate flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-black dark:text-white">
                      code
                    </span>
                    {selectedRepoForReadme.fullName} / README.md
                  </h3>
                  <a
                    href={selectedRepoForReadme.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-[#888] hover:underline truncate"
                  >
                    {selectedRepoForReadme.htmlUrl}
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRepoForReadme(null);
                    setReadmeData(null);
                  }}
                  className="text-[#888] hover:text-black dark:hover:text-white p-1 rounded-lg hover:bg-[#f4f4f5] dark:hover:bg-[#1f1f23] transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Status Header */}
              {isFetchingReadme ? (
                <div className="py-16 text-center text-[#666] dark:text-[#888] flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
                  <span className="text-xs font-mono">Fetching README.md content from GitHub...</span>
                </div>
              ) : readmeError ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{readmeError}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-mono text-[#666] dark:text-[#888] border-y border-[#e5e5e5] dark:border-[#222] py-2.5">
                    <div>
                      Length:{" "}
                      <span className="text-black dark:text-white font-semibold">
                        {readmeData?.content?.length || 0}
                      </span>{" "}
                      chars
                    </div>
                    <div>
                      Estimated Chunks:{" "}
                      <span className="text-black dark:text-white font-semibold">
                        {Math.max(1, Math.ceil((readmeData?.content?.length || 0) / 500))}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[50vh] bg-[#fafafa] dark:bg-[#080808] p-4 rounded-xl border border-[#e5e5e5] dark:border-[#333] font-mono text-xs text-[#222] dark:text-[#ddd] whitespace-pre-wrap leading-relaxed select-text">
                    {readmeData?.content || "(Empty README)"}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRepoForReadme(null);
                        setReadmeData(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-[#e5e5e5] dark:border-[#333] text-xs font-medium text-[#666] dark:text-[#aaa] hover:bg-[#f4f4f5] dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isSavingData || !readmeData?.content}
                      onClick={handleSaveReadmeData}
                      className="bg-black dark:bg-white text-white dark:text-black rounded-xl px-6 py-2.5 text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingData ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white dark:border-black border-t-transparent animate-spin" />
                          <span>Saving & Indexing...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">
                            save
                          </span>
                          <span>Save the Data</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Website & GitHub Sources Table (Shared Table) */}
      <div className="bg-white dark:bg-[#111] rounded-[2rem] overflow-hidden border border-[#e5e5e5] dark:border-[#222] shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#e5e5e5] dark:border-[#222] text-[11px] uppercase tracking-widest text-[#888] font-mono bg-[#fafafa] dark:bg-[#151515]">
          <div className="col-span-5">Source Title / URL</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Chunks</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="flex flex-col divide-y divide-[#e5e5e5] dark:divide-[#222]">
          {loading ? (
            <div className="px-6 py-12 text-center text-[#666] dark:text-[#888] flex items-center justify-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
              Loading indexed sources...
            </div>
          ) : websites.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#666] dark:text-[#888]">
              No website URLs or GitHub READMEs indexed yet.
            </div>
          ) : (
            websites.map((web) => (
              <motion.div
                variants={item}
                key={web.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#fafafa] dark:hover:bg-[#151515] transition-colors"
              >
                <div className="col-span-5 flex items-center gap-3 text-sm font-medium text-black dark:text-white overflow-hidden">
                  <span className="material-symbols-outlined text-lg text-[#666] dark:text-[#888] shrink-0">
                    {web.url?.includes("github.com") ? "code" : "public"}
                  </span>
                  <div className="flex flex-col overflow-hidden text-left">
                    <button
                      onClick={() =>
                        setSelectedDocForView({
                          fileName: web.title || web.url,
                          extractedText: web.extractedText,
                          chunkCount: web.chunkCount,
                          status: web.status,
                        })
                      }
                      title="Click to view scraped text"
                      className="truncate hover:underline text-left text-black dark:text-white font-medium flex items-center gap-1.5 group cursor-pointer"
                    >
                      <span className="truncate">{web.title || web.url}</span>
                      <span className="material-symbols-outlined text-base text-[#888] group-hover:text-black dark:group-hover:text-white transition-colors">
                        visibility
                      </span>
                    </button>
                    <a
                      href={web.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#888] hover:underline truncate"
                    >
                      {web.url}
                    </a>
                  </div>
                </div>
                <div className="col-span-3">
                  {web.status === "ready" || web.status === "active" ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[11px] font-mono uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Ready
                    </div>
                  ) : web.status === "failed" ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-mono uppercase tracking-widest">
                      <span className="material-symbols-outlined text-xs">
                        error
                      </span>
                      <span>Failed</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-mono uppercase tracking-widest">
                      <span className="material-symbols-outlined text-xs animate-spin">
                        sync
                      </span>
                      <span>Indexing...</span>
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-right text-[13px] font-mono text-[#666] dark:text-[#888]">
                  {web.chunkCount || 0}
                </div>
                <div className="col-span-2 text-right flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      setSelectedDocForView({
                        fileName: web.title || web.url,
                        extractedText: web.extractedText,
                        chunkCount: web.chunkCount,
                        status: web.status,
                      })
                    }
                    title="View Text"
                    className="text-[#888] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      visibility
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirmItem({
                        type: "website",
                        id: web.id,
                        title: web.title || web.url,
                      })
                    }
                    title="Delete Source"
                    className="text-[#888] hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
