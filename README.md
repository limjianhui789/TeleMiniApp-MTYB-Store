# MTYB Virtual Goods Platform

A plugin-based virtual goods purchasing platform built as a Telegram Mini App. This platform supports various types of virtual products through a flexible plugin architecture, with integrated Curlec payment gateway for seamless transactions.

## 🚀 Features

- 🔌 **Plugin Architecture** - Extensible system for different product types
- 💳 **Curlec Payment Integration** - Secure payment processing
- 🤖 **Automated Delivery** - Automatic order fulfillment after payment
- 📱 **Telegram Native** - Full Telegram Mini App integration
- 🔐 **Secure & Reliable** - Complete order management and payment verification

## 🛠️ Technology Stack

- [React](https://react.dev/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Curlec Payment Gateway](https://curlec.com/) - Payment processing
- [@telegram-apps SDK](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/2-x) - Telegram integration
- [Telegram UI](https://github.com/Telegram-Mini-Apps/TelegramUI) - Native UI components
- [Vite](https://vitejs.dev/) - Build tool

## 📋 Development Status

### ✅ Phase 1: Basic Infrastructure (COMPLETED)
- [x] Project structure and TypeScript configuration
- [x] Core type definitions system (User, Product, Order, Payment, Plugin types)
- [x] Plugin interface specifications and base classes
- [x] Basic component library extensions (LoadingSpinner, ErrorBoundary, Notifications)
- [x] Environment configuration management
- [x] Logging and validation utilities
- [x] Event system for component communication
- [x] Configuration management system

### ✅ Phase 2: Plugin System Core (COMPLETED)
- [x] PluginManager core class implementation
- [x] Plugin registration and discovery mechanism
- [x] Plugin lifecycle management (enable, disable, reload)
- [x] Plugin health monitoring and error handling
- [x] Plugin event system for communication
- [x] Plugin development tools and testing utilities
- [x] Demo plugin implementation
- [x] Interactive plugin testing in demo page

### 🔄 Phase 3: Payment Integration (NEXT)
- [ ] Curlec payment gateway integration
- [ ] Order management system with plugin integration
- [ ] Payment security mechanisms and webhook handling
- [ ] Payment flow integration with plugin system

### ⏳ Upcoming Phases
- **Phase 4**: Product Management System
- **Phase 5**: Example Plugin Development (VPN, Netflix, Steam)
- **Phase 6**: UI/UX Enhancement

## 🎯 Demo

Visit `/demo` in the application to explore:
- ✅ Core infrastructure components
- ✅ Type system demonstration
- ✅ Utility classes (Logger, Validator, Config Manager)
- ✅ Component testing (Loading, Error Handling, Notifications)
- ✅ Environment configuration display
- ✅ **NEW**: Plugin system testing and demonstration
- ✅ **NEW**: Live plugin registration and execution
- ✅ **NEW**: Plugin health monitoring and error handling

## 📋 Supported Product Types

The platform supports various virtual goods through plugins:

- **VPN Services** - Automatic account creation via API integration
- **Streaming Accounts** - Email-based account delivery (Netflix, etc.)
- **Gaming Products** - KeyAuth integration for license keys (Steam, etc.)
- **Software Licenses** - Custom license key generation
- **Custom Products** - Extensible plugin system for any virtual good

## 📚 Documentation

- [Architecture Design](docs/ARCHITECTURE.md) - System architecture and design principles
- [Development Plan](docs/DEVELOPMENT_PLAN.md) - Detailed development roadmap
- [Plugin Development Guide](docs/PLUGIN_DEVELOPMENT_GUIDE.md) - How to create custom plugins
- [Phase 1 Summary](docs/PHASE1_COMPLETION_SUMMARY.md) - Basic infrastructure completion
- [Phase 2 Summary](docs/PHASE2_COMPLETION_SUMMARY.md) - Plugin system core completion

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Telegram Bot created via [@BotFather](https://t.me/botfather)
- Curlec payment gateway account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mtyb-shop

# Install dependencies
npm install
```

## Scripts

This project contains the following scripts:

- `dev`. Runs the application in development mode.
- `dev:https`. Runs the application in development mode using locally created valid SSL-certificates.
- `build`. Builds the application for production.
- `lint`. Runs [eslint](https://eslint.org/) to ensure the code quality meets
  the required standards.
- `deploy`. Deploys the application to GitHub Pages.

To run a script, use the `npm run` command:

```Bash
npm run {script}
# Example: npm run build
```

## Create Bot and Mini App

Before you start, make sure you have already created a Telegram Bot. Here is
a [comprehensive guide](https://docs.telegram-mini-apps.com/platform/creating-new-app)
on how to do it.

## Run

Although Mini Apps are designed to be opened
within [Telegram applications](https://docs.telegram-mini-apps.com/platform/about#supported-applications),
you can still develop and test them outside of Telegram during the development
process.

To run the application in the development mode, use the `dev` script:

```bash
npm run dev:https
```

> [!NOTE]
> As long as we use [vite-plugin-mkcert](https://www.npmjs.com/package/vite-plugin-mkcert),
> launching the dev mode for the first time, you may see sudo password request.
> The plugin requires it to properly configure SSL-certificates. To disable the plugin, use the `npm run dev` command.

After this, you will see a similar message in your terminal:

```bash
VITE v5.2.12  ready in 237 ms

➜  Local:   https://localhost:5173/reactjs-template
➜  Network: https://172.18.16.1:5173/reactjs-template
➜  Network: https://172.19.32.1:5173/reactjs-template
➜  Network: https://192.168.0.171:5173/reactjs-template
➜  press h + enter to show help
```

Here, you can see the `Local` link, available locally, and `Network` links
accessible to all devices in the same network with the current device.

To view the application, you need to open the `Local`
link (`https://localhost:5173/reactjs-template` in this example) in your
browser:

![Application](assets/application.png)

It is important to note that some libraries in this template, such as
`@telegram-apps/sdk`, are not intended for use outside of Telegram.

Nevertheless, they appear to function properly. This is because the
`src/mockEnv.ts` file, which is imported in the application's entry point (
`src/index.ts`), employs the `mockTelegramEnv` function to simulate the Telegram
environment. This trick convinces the application that it is running in a
Telegram-based environment. Therefore, be cautious not to use this function in
production mode unless you fully understand its implications.

> [!WARNING]
> Because we are using self-signed SSL certificates, the Android and iOS
> Telegram applications will not be able to display the application. These
> operating systems enforce stricter security measures, preventing the Mini App
> from loading. To address this issue, refer to
> [this guide](https://docs.telegram-mini-apps.com/platform/getting-app-link#remote).

## Deploy

This boilerplate uses GitHub Pages as the way to host the application
externally. GitHub Pages provides a CDN which will let your users receive the
application rapidly. Alternatively, you could use such services
as [Heroku](https://www.heroku.com/) or [Vercel](https://vercel.com).

### Manual Deployment

This boilerplate uses the [gh-pages](https://www.npmjs.com/package/gh-pages)
tool, which allows deploying your application right from your PC.

#### Configuring

Before running the deployment process, ensure that you have done the following:

1. Replaced the `homepage` value in `package.json`. The GitHub Pages deploy tool
   uses this value to
   determine the related GitHub project.
2. Replaced the `base` value in `vite.config.ts` and have set it to the name of
   your GitHub
   repository. Vite will use this value when creating paths to static assets.

For instance, if your GitHub username is `telegram-mini-apps` and the repository
name is `is-awesome`, the value in the `homepage` field should be the following:

```json
{
  "homepage": "https://telegram-mini-apps.github.io/is-awesome"
}
```

And `vite.config.ts` should have this content:

```ts
export default defineConfig({
  base: '/is-awesome/',
  // ...
});
```

You can find more information on configuring the deployment in the `gh-pages`
[docs](https://github.com/tschaub/gh-pages?tab=readme-ov-file#github-pages-project-sites).

#### Before Deploying

Before deploying the application, make sure that you've built it and going to
deploy the fresh static files:

```bash
npm run build
```

Then, run the deployment process, using the `deploy` script:

```Bash
npm run deploy
```

After the deployment completed successfully, visit the page with data according
to your username and repository name. Here is the page link example using the
data mentioned above:
https://telegram-mini-apps.github.io/is-awesome

### GitHub Workflow

To simplify the deployment process, this template includes a
pre-configured [GitHub workflow](.github/workflows/github-pages-deploy.yml) that
automatically deploys the project when changes are pushed to the `master`
branch.

To enable this workflow, create a new environment (or edit the existing one) in
the GitHub repository settings and name it `github-pages`. Then, add the
`master` branch to the list of deployment branches.

You can find the environment settings using this
URL: `https://github.com/{username}/{repository}/settings/environments`.

![img.png](.github/deployment-branches.png)

In case, you don't want to do it automatically, or you don't use GitHub as the
project codebase, remove the `.github` directory.

### GitHub Web Interface

Alternatively, developers can configure automatic deployment using the GitHub
web interface. To do this, follow the link:
`https://github.com/{username}/{repository}/settings/pages`.

## TON Connect

This boilerplate utilizes
the [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/overview)
project to demonstrate how developers can integrate functionality related to TON
cryptocurrency.

The TON Connect manifest used in this boilerplate is stored in the `public`
folder, where all publicly accessible static files are located. Remember
to [configure](https://docs.ton.org/develop/dapps/ton-connect/manifest) this
file according to your project's information.

## Useful Links

- [Platform documentation](https://docs.telegram-mini-apps.com/)
- [@telegram-apps/sdk-react documentation](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk-react)
- [Telegram developers community chat](https://t.me/devs)
