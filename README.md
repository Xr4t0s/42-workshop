# 42 Workshop - Sui Project

Thanks for attending the 42 Workshop! This repository is for students to publish their Sui projects.

## Ideas

Your project can be **anything** you want, as long as it uses **Move**. You can build any kind of application, and there can be any kind of way to interact with it—whether through a front-end interface, scripts, a custom CLI, Sui CLI commands, or any other method.

Here are some ideas to get you started:

- **DeFi Protocols**: Simple lending platforms, decentralized exchanges (DEX), liquidity pools, or yield farming contracts
- **Games**: Board games, video games (not necessarily with a GUI), turn-based games, or any game logic that can benefit from blockchain
- **Crowdfunding**: Platform for raising funds, with milestone-based releases or donation systems
- **Publishing Platform**: Content publishing, NFT-based articles, or decentralized media
- **Social Media**: Decentralized social networks, reputation systems, or community governance
- **NFT Projects**: Custom NFT collections, marketplaces, or utility tokens
- **Governance Systems**: Voting mechanisms, DAO structures, or proposal systems
- **Supply Chain**: Tracking systems, provenance verification, or logistics management
- **Identity Systems**: Decentralized identity, reputation, or credential verification
- **Or anything else** that interests you and leverages Move's capabilities!

The key is to be creative and build something that demonstrates your understanding of Move and the Sui blockchain.


## Getting Started

### 1. Fork This Repository

First, please **fork this repository** to your own GitHub account. This will create your own copy where you can work on your project.

### 2. Create Your Project Directory

After forking and cloning the repository, create a directory for your project. Use the following naming convention:

```
your-username/project-name
```

Replace `your-username` with your actual GitHub username and `project-name` with a descriptive project name.

### 3. Publish Your Sui Project

Place your Sui Move project files in your directory. Make sure to include:

- Your Move source files (`.move` files) with tests
- A `Move.toml` with the `Move.lock` (tracking published packages)
- A way to interact with the smart contract(s) (front-end interface, scripts, custom CLI, Sui CLI commands)
- A README for your specific project explaining what it is, how it is designed and how to interact with it

### 4. Submit Your Work

Once you've completed your project:

1. Commit your changes
2. Push to your forked repository
3. Create a pull request to this repository

## Project Structure

Your directory structure should look something like this:

```
project-name/
├── Move.toml
├── sources/
│   └── module1.move
│   └── module2.move
├── tests/
│   └── integration_tests.move
└── README.md
```

## Resources

- [Sui Documentation](https://docs.sui.io/)
- [Move Language Documentation](https://move-book.com/)
- [Sui Tutorials](https://medium.com/@BlockRunner)

## Questions?

If you have any questions, please open an issue in this repository or contact the workshop organizers.

Good luck with your Sui Move project!
