# speech-to-text

vist https://stt.deepso.dev for a live demo.

Speech to text conversion using [Google Cloud Speech-to-Text API](https://cloud.google.com/speech-to-text).

## Prerequisites

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the Speech-to-Text API.
3. Create a service account and download the JSON key file.
4. Set the `GCP_CREDENTIALS` environment variable as JSON.stringyfied key file or paste it in server/.env.

## Installation

```bash
bun i
```

## Usage

### Web

```bash
bun web
```

### Server

```bash
bun server
```
