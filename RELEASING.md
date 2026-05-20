# Steps to release a new version

1. Update **changelog**.
2. Bump **manifest** version AND **common.js version**.
3. (optional) Bump chrome version in versions.json
4. Update **readme** (version at top and link at bottom).
5. Update **updates.json**.
6. `jj commit -m "Release v<version>"`
7. Run `./publish-release <version>`.
8. Upload to chrome webstore
