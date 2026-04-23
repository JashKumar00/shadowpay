import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "child_process";

const OWNER = "JashKumar00";
const REPO = "shadowpay";
const BRANCH = "main";
const REPO_ROOT = "/home/runner/workspace";

const connectors = new ReplitConnectors();

async function ghApi(endpoint, options = {}) {
  const response = await connectors.proxy("github", endpoint, options);
  return response;
}

// Get remote HEAD
const refResp = await ghApi(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`);
const refData = await refResp.json();
const headSha = refData.object.sha;

const commitResp = await ghApi(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`);
const commitData = await commitResp.json();

const treeResp = await ghApi(`/repos/${OWNER}/${REPO}/git/trees/${commitData.tree.sha}?recursive=1`);
const treeData = await treeResp.json();
const remoteFiles = treeData.tree.filter(t => t.type === "blob").map(t => t.path);

const localFiles = new Set(
  execSync("git ls-files", { cwd: REPO_ROOT })
    .toString().trim().split("\n").filter(Boolean)
);

const missingFromGitHub = [...localFiles].filter(f => !remoteFiles.includes(f));
const extraOnGitHub = remoteFiles.filter(f => !localFiles.has(f));

console.log("=== GitHub Sync Verification ===");
console.log("Remote HEAD:", headSha);
console.log("Latest commit:", commitData.message?.split('\n')[0]);
console.log("Remote blobs:", remoteFiles.length);
console.log("Local tracked files:", localFiles.size);
console.log("Files missing from GitHub:", missingFromGitHub.length);
console.log("Extra files on GitHub:", extraOnGitHub.length);

const screenshots = remoteFiles.filter(f => f.startsWith("screenshots/"));
console.log("\nScreenshots on GitHub:", screenshots);

if (missingFromGitHub.length === 0 && extraOnGitHub.length === 0) {
  console.log("\n✓ GitHub is perfectly in sync with local repo!");
} else {
  if (missingFromGitHub.length > 0) console.log("Missing:", missingFromGitHub);
  if (extraOnGitHub.length > 0) console.log("Extra:", extraOnGitHub);
}
