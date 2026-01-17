# Cloudflare Workflows

This is the starter template for Workflows, a durable execution engine built on top of Cloudflare Workers.

* Clone this repository to get started with Workflows
* Read the [Workflows announcement blog](https://blog.cloudflare.com/building-workflows-durable-execution-on-workers/) to learn more about what Workflows is and how to build durable, multi-step applications using the Workflows model.
* Review the [Workflows developer documentation](https://developers.cloudflare.com/workflows/) to dive deeper into the Workflows API and how it works.

## Usage

**Visit the [get started guide](https://developers.cloudflare.com/workflows/get-started/guide/) for Workflows to create and deploy your first Workflow.**

### Deploy it

You can create a project using this template by using `npm create cloudflare@latest`:

```sh
npm create cloudflare@latest workflows-starter -- --template "cloudflare/workflows-starter"
```

This will automatically clone this repository, install the dependencies, and prompt you to optionally deploy.

The [Workflows documentation](https://developers.cloudflare.com/workflows/) contains examples, the API reference, and architecture guidance.

## Getting Started

1. Install the project dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run start
   ```

3. Deploy to Cloudflare:
   ```bash
   npm run deploy
   ```

## Project Structure

* `src/index.ts` - Main workflow implementation with the `MyWorkflow` class and fetch handler
* `wrangler.jsonc` - Cloudflare Workers configuration with workflows binding
* `tsconfig.json` - TypeScript configuration

## License

Copyright 2024, Cloudflare. Apache 2.0 licensed.
