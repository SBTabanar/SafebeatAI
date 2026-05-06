# Contributing to SafeBeat AI

Thank you for your interest in contributing to SafeBeat AI! We welcome contributions from the community and are pleased to have you join us.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots or GIFs** if applicable
- **Include your environment details** (OS, browser, Python version, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` for your feature or bug fix (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and ensure the application builds successfully
5. Commit your changes using a clear commit message
6. Push to your fork
7. Open a Pull Request against the `main` branch

#### Pull Request Guidelines

- Update the README.md with details of changes to the interface, if applicable.
- Ensure your code follows the existing style and conventions.
- Write clear, concise commit messages.
- Reference any relevant issues in your PR description.

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional but recommended)

### Local Development

```bash
# Clone your fork
git clone https://github.com/<your-username>/SafebeatAI.git
cd SafebeatAI

# Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

### Using Docker

```bash
docker-compose up --build
```

The frontend will be available at http://localhost:5173 and the backend at http://localhost:5001.

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing!
