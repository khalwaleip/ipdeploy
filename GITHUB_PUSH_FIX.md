# GitHub Push Permission Fix

## ❌ Current Issue

Git is trying to push with user `paisleeymusic@gmail.com` but the repository belongs to `khalwaleip`.

**Error:** `Permission to khalwaleip/ipdeploy.git denied to paisleeymusic`

---

## ✅ Solution Options

### Option 1: Use GitHub Personal Access Token (RECOMMENDED)

1. **Create a Personal Access Token:**
   - Go to: <https://github.com/settings/tokens>
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - Give it a name: `Khalwale IP Deploy`
   - Select scopes: ✅ `repo` (full control of private repositories)
   - Click **"Generate token"**
   - **COPY THE TOKEN** (you won't see it again!)

2. **Update Git Remote to Use Token:**

   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/khalwaleip/ipdeploy.git
   ```

   Replace `YOUR_TOKEN` with the token you just copied.

3. **Push Again:**

   ```bash
   git push origin main
   ```

---

### Option 2: Configure Git for This Repository

Set the correct user for this specific repository:

```bash
# Set user for this repo only
git config user.name "khalwaleip"
git config user.email "khalwaleip@gmail.com"

# Clear cached credentials
git credential reject https://github.com
```

### Option 3: Switch GitHub Account Globally

If you want to use the `khalwaleip` account for all repositories:

```bash
# Set global git user
git config --global user.name "khalwaleip"
git config --global user.email "khalwaleip@gmail.com"

# Clear all cached credentials
git credential-manager delete https://github.com
```

---

## 🔒 Security Note

**NEVER commit tokens or passwords to git!** They are already protected in `.gitignore`:

- ✅ `.env.local` (contains Supabase credentials)
- ✅ `credentials.json` (contains sensitive data)

---

## ✅ After Fixing

Once you've set up the credentials, run:

```bash
git push origin main
```

Your changes will be pushed to: <https://github.com/khalwaleip/ipdeploy>
