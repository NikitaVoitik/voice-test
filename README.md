# Voice Test App

A simple Next.js application to compare **ElevenLabs** and **Cartesia** text-to-speech APIs side-by-side.

## Features

- Enter text and generate audio using both ElevenLabs and Cartesia APIs
- Side-by-side comparison of audio output from both services
- Clean, responsive UI built with Next.js and Tailwind CSS
- Real-time audio playback with HTML5 audio controls

## Getting Started

### Prerequisites

- Node.js (version 20 or higher)
- npm or yarn package manager
- API keys from:
  - [ElevenLabs](https://elevenlabs.io/)
  - [Cartesia](https://cartesia.ai/)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NikitaVoitik/voice-test.git
cd voice-test
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your API keys to the `.env` file:
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
CARTESIA_API_KEY=your_cartesia_api_key_here
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. Enter text in the text area
2. Click "Generate Audio" on either the ElevenLabs or Cartesia card
3. Wait for the audio to be generated
4. Play the audio using the built-in audio controls
5. Compare the output from both services

## API Routes

- `/api/elevenlabs` - POST endpoint for ElevenLabs text-to-speech
- `/api/cartesia` - POST endpoint for Cartesia text-to-speech

Both endpoints accept JSON with the following structure:
```json
{
  "text": "Your text to convert to speech"
}
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ElevenLabs SDK** - Text-to-speech API
- **Cartesia SDK** - Text-to-speech API
- **Biome** - Linting and formatting

## Code Quality

Run the linter:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

## License

This project is private and for demonstration purposes.
