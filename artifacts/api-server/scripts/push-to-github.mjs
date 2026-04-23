/**
 * Push all tracked local files to the GitHub repository.
 * Uses the GitHub Git Data API via Replit's GitHub integration.
 *
 * Usage: node scripts/push-to-github.mjs
 */

import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";

const OWNER = "JashKumar00";
const REPO = "shadowpay";
const BRANCH = "main";
const REPO_ROOT = "/home/runner/workspace";

// Files that are too large for the API proxy and must be excluded.
// Add paths here if new large binary files appear that cannot be proxy-uploaded.
// Note: MP4s in attached_assets/ are excluded via .gitignore and not tracked.
const KNOWN_LARGE_FILES = new Set([]);

const connectors = new ReplitConnectors();

async function ghApi(endpoint, options = {}) {
  const response = await connectors.proxy("github", endpoint, options);
  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`GitHub API ${endpoint} failed (${response.status}): ${text}`);
  }
  return response;
}

async function getRemoteState() {
  const refResp = await ghApi(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`);
  if (refResp.status === 404) return { headSha: null, treeSha: null, remoteFileMap: {} };
  const refData = await refResp.json();
  const headSha = refData.object?.sha;

  const commitResp = await ghApi(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`);
  const commitData = await commitResp.json();
  const treeSha = commitData.tree?.sha;

  const treeResp = await ghApi(`/repos/${OWNER}/${REPO}/git/trees/${treeSha}?recursive=1`);
  const treeData = await treeResp.json();
  const remoteFileMap = {};
  for (const item of treeData.tree || []) {
    if (item.type === "blob") {
      remoteFileMap[item.path] = { sha: item.sha, mode: item.mode };
    }
  }
  return { headSha, treeSha, remoteFileMap };
}

async function createBlob(content, encoding) {
  const resp = await ghApi(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, encoding }),
  });
  const data = await resp.json();
  if (!data.sha) throw new Error("No SHA in response: " + JSON.stringify(data));
  return data.sha;
}

async function main() {
  const allFiles = execSync("git ls-files", { cwd: REPO_ROOT })
    .toString().trim().split("\n").filter(Boolean);

  console.log(`Local repo has ${allFiles.length} tracked files`);

  const { headSha, treeSha, remoteFileMap } = await getRemoteState();
  console.log(`Remote HEAD: ${headSha || "none"}`);
  console.log(`Remote has ${Object.keys(remoteFileMap).length} blob files`);

  // Get local git object SHAs and modes to compare with remote
  // `git ls-files -s` output: <mode> <sha> <stage>\t<file>
  const localFileInfo = {};
  for (const file of allFiles) {
    const line = execSync(`git ls-files -s -- "${file}"`, { cwd: REPO_ROOT }).toString().trim();
    const parts = line.split(/\s+/);
    localFileInfo[file] = { mode: parts[0] || "100644", sha: parts[1] || null };
  }

  // Find changed/new files and deleted files
  const toUpload = allFiles.filter(
    (f) => localFileInfo[f].sha !== remoteFileMap[f]?.sha || localFileInfo[f].mode !== remoteFileMap[f]?.mode
  );
  const toDelete = Object.keys(remoteFileMap).filter((f) => !allFiles.includes(f));

  console.log(`Files to upload: ${toUpload.length}, Files to delete: ${toDelete.length}`);
  if (toUpload.length === 0 && toDelete.length === 0) {
    console.log("Already in sync — nothing to push.");
    return;
  }

  const treeItems = [];

  // Create blobs for changed files
  const skipped = [];
  for (let i = 0; i < toUpload.length; i++) {
    const file = toUpload[i];
    const fullPath = path.join(REPO_ROOT, file);

    if ((i + 1) % 20 === 0 || i === 0) {
      process.stdout.write(`  [${i + 1}/${toUpload.length}] ${file}\n`);
    }

    let content, encoding;
    try {
      const buffer = readFileSync(fullPath);
      const hasBinaryBytes = buffer.includes(0);
      if (hasBinaryBytes) {
        content = buffer.toString("base64");
        encoding = "base64";
      } else {
        const text = buffer.toString("utf8");
        if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) {
          content = buffer.toString("base64");
          encoding = "base64";
        } else {
          content = text;
          encoding = "utf-8";
        }
      }
    } catch (err) {
      console.warn(`  Skipping ${file}: ${err.message}`);
      skipped.push(file);
      continue;
    }

    try {
      const blobSha = await createBlob(content, encoding);
      const mode = localFileInfo[file]?.mode || "100644";
      treeItems.push({ path: file, mode, type: "blob", sha: blobSha });
    } catch (err) {
      console.error(`  Failed blob for ${file}: ${err.message}`);
      skipped.push(file);
    }
  }

  // Mark deleted files with sha: null
  for (const file of toDelete) {
    const mode = remoteFileMap[file]?.mode || "100644";
    treeItems.push({ path: file, mode, type: "blob", sha: null });
  }

  // Abort if unexpected files were skipped (not in the known allowlist)
  const unexpectedSkips = skipped.filter((f) => !KNOWN_LARGE_FILES.has(f));
  if (unexpectedSkips.length > 0) {
    console.error(`\nAborting: ${unexpectedSkips.length} unexpected file(s) could not be uploaded:`);
    unexpectedSkips.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }

  if (treeItems.length === 0) {
    console.log("No tree items to commit.");
    if (skipped.length > 0) {
      console.log(`(${skipped.length} known large file(s) skipped — push via git with GITHUB_TOKEN)`);
    }
    return;
  }

  // Create new tree using the remote tree as base
  console.log(`\nCreating tree (base: ${treeSha || "none"})...`);
  const treeBody = treeSha
    ? { base_tree: treeSha, tree: treeItems }
    : { tree: treeItems };

  const treeResp = await ghApi(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(treeBody),
  });
  const newTree = await treeResp.json();
  console.log("New tree SHA:", newTree.sha);

  const localMessage = execSync("git log -1 --pretty=%B HEAD", { cwd: REPO_ROOT }).toString().trim();
  const commitMessage = `Sync ShadowPay codebase to GitHub\n\nLatest local commit: ${localMessage}`;

  console.log("Creating commit...");
  const commitBody = {
    message: commitMessage,
    tree: newTree.sha,
    parents: headSha ? [headSha] : [],
  };
  const commitResp = await ghApi(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(commitBody),
  });
  const newCommit = await commitResp.json();
  console.log("Commit SHA:", newCommit.sha);

  console.log("Updating branch ref...");
  await ghApi(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommit.sha, force: true }),
  });

  console.log(`\nDone! https://github.com/${OWNER}/${REPO}`);
  if (skipped.length > 0) {
    console.log(`\nNote: ${skipped.length} known large file(s) were skipped (allowlisted):`);
    skipped.forEach((f) => console.log(`  - ${f}`));
    console.log("Push these via: git push with a stored GITHUB_TOKEN secret.");
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
