# Sight Reading / Sight Music Trainer (SR/SM)

A web-based trainer for piano sight-reading, focusing on identifying notes and chords on the grand staff. It uses a spaced repetition system (SRS) to optimize your learning efficiency.

## Features

- **Smart Scheduling**: Powered by the **FSRS** (Free Spaced Repetition Scheduler) algorithm, the app intelligently schedules reviews based on your performance, ensuring you practice difficult items more often.
- **Dynamic Content Generation**:
    - **Single Notes**: Practice recognizing individual notes across customizable octave ranges (C2-C6).
    - **Chords**: Train on various chord types (Major, Minor, etc.) with configurable complexity.
    - **Sheet Music Rendering**: High-quality, real-time sheet music rendering using `opensheetmusicdisplay`.
- **Interactive Practice**:
    - **MIDI Support**: Connect your MIDI keyboard for the most authentic practice experience.
    - **Virtual Piano**: An on-screen piano for mouse or touch input.
    - **Keyboard Shortcuts**: Use `Space` to submit your answer.
- **Real-Time Feedback**:
    - **Audio Playback**: Hear the notes you play and the correct answer using high-quality SoundFonts (`soundfont-player`).
    - **Visual Indicators**: Instant visual feedback on correct and incorrect notes on the stave.
- **Session Tracking**: Track your session accuracy, total reviews, and history.

## Tech Stack

This project is built with a modern React stack:

-   **Frontend Framework**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Music Rendering**: [OpenSheetMusicDisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay)
-   **Audio**: [soundfont-player](https://github.com/ danigb/soundfont-player)
-   **Spaced Repetition**: [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or higher recommended)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd sr-sm-trainer
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the App

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal).

### building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` directory.

## Usage

1.  **Select Mode**: Choose between "C2-C6" (Single Notes) or "Chords" mode.
2.  **Start Session**: Click "Start Session" to begin.
3.  **Play**:
    -   Look at the note(s) displayed on the staff.
    -   Play the corresponding notes on your MIDI keyboard or the virtual piano.
    -   Press `Space` or click "Submit" to check your answer.
4.  **Grade**: The system will automatically grade your performance based on accuracy and speed.
5.  **Repeat**: Continue practicing as the scheduler serves up new challenges!
