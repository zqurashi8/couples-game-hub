# 🚀 GitHub Setup Guide

Follow these steps to get your Couples Game Hub on GitHub and deploy it online!

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **+** button in the top right corner
3. Select **New repository**
4. Fill in the details:
   - **Repository name:** `couples-game-hub`
   - **Description:** "Fun competitive games for couples"
   - **Public** or **Private** (your choice)
   - ❌ Don't initialize with README (we already have one)
5. Click **Create repository**

## Step 2: Initialize Git in Your Project

Open a terminal in the `couples-game-hub` folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit: Add 5 couple games"

# Rename branch to main (if needed)
git branch -M main
```

## Step 3: Connect to GitHub

Replace `yourusername` with your actual GitHub username:

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/couples-game-hub.git

# Push your code
git push -u origin main
```

## Step 4: Enable GitHub Pages (Free Hosting!)

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes for deployment
7. Your site will be live at: `https://yourusername.github.io/couples-game-hub/`

## Step 5: Update README with Live URL

1. Edit `README.md`
2. Replace `[Your GitHub Pages URL here]` with your actual URL
3. Commit and push:

```bash
git add README.md
git commit -m "Update README with live URL"
git push
```

## 🎉 You're Done!

Your games are now:
- ✅ Backed up on GitHub
- ✅ Live on the internet
- ✅ Ready to share with anyone

## Making Updates

Whenever you make changes to your games:

```bash
# Check what changed
git status

# Add your changes
git add .

# Commit with a message
git commit -m "Describe what you changed"

# Push to GitHub
git push
```

GitHub Pages will automatically update your live site in 1-2 minutes!

## Using Git from VS Code

If you use VS Code:

1. Open the `couples-game-hub` folder in VS Code
2. Click the Source Control icon (branch icon on left sidebar)
3. Stage changes by clicking the **+** next to files
4. Write a commit message at the top
5. Click the **✓** checkmark to commit
6. Click **...** → **Push** to upload to GitHub

## Tips for Collaboration

If you want to work with your partner:

1. Add them as a collaborator:
   - Repository Settings → Collaborators → Add people
2. They can clone the repository:
   ```bash
   git clone https://github.com/yourusername/couples-game-hub.git
   ```
3. Before making changes, always pull first:
   ```bash
   git pull
   ```
4. Make changes, commit, and push

## Common Git Commands

```bash
# See what you changed
git status

# See the history
git log --oneline

# Undo changes to a file (before commit)
git checkout -- filename.html

# Create a new branch for experiments
git checkout -b new-feature

# Switch back to main branch
git checkout main

# Merge a branch into main
git merge new-feature
```

## Troubleshooting

### "Permission denied"
- Make sure you're logged into GitHub
- Use a personal access token instead of password
- Settings → Developer settings → Personal access tokens

### "Repository not found"
- Double-check the repository URL
- Make sure the repository exists on GitHub
- Check if it's public or if you have access

### Changes not showing on live site
- Wait 2-3 minutes after pushing
- Check GitHub Actions tab for deployment status
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)

## Need Help?

- [GitHub Docs](https://docs.github.com)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [GitHub Pages](https://pages.github.com/)

Happy coding! 🎮
