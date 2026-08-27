@echo off
git config user.name "the-farazz"
git config user.email "farazalam706@gmail.com"
gh auth switch --user "the-farazz"
git add .
git commit -m "first commit"
git push origin main
echo Push completed successfully!
