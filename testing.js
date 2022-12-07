module.exports = async ({ github, context }) => {
  const meta = await github.rest.meta.get();
  console.log('meta:', meta);
  const commit = await github.rest.repos.getCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: `${SHA}`,
  });
  console.log('commit:', commit);
  core.exportVariable('author', commit.data.commit.author.email);
  return context.payload.client_payload.value;
};
