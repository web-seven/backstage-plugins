# Changesets

Every PR that changes a published plugin needs a changeset:

```bash
yarn changeset
```

Pick the changed packages, the bump type (patch, minor, major) and write a short summary. Commit the generated file with the PR.

After merge to `main` the release workflow opens or updates the "Version Packages" PR. Merging that PR publishes the bumped packages to npm.
