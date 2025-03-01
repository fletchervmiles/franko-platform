# Implementation Notes

## Overview

The goal is to 
- Create an efficient Progress Bar Updater that updates the objectiveProgress JSON object in the database based on the conversation's progress. 
  - This should run on each turn after the objectiveUpdate function has returned - this is as the response from the most recent objectiveUpdate should be fed into the progress updater prompt - agent_prompts\progress_bar_updater.md

- Update the current objectiveUpdate function to use the following new prompt - agent_prompts\objective_update_prompt.md
  - objectiveUpdate function should run each turn after the agent response
  - it should not be responsible for the progress bar update
  - the main change is to seperate the existing functionality with this new functionality as part of the Progress Bar Updater  

There is existing functionality in our code but we need to update it and replace with the following implementation instructions and requirements.

The JSON structure, that should be initalised with each new chat - app\(chat)\chat\[id]\page.tsx - is this:

{
  "objectives": {
    "objective01": { "status": "current" },
    "objective02": { "status": "tbc" },
    "objective03": { "status": "tbc" },
    "objective04": { "status": "tbc" },
    "objective05": { "status": "tbc" }
  }
}

The updater should:

- Use the full history of objective_update_prompt outputs to determine the current state. Note, we can either use the full message conversation (as found in app\(chat)\api\chat\route.ts or we will need to pull out and save the messages from the objectiveUpdater function, which should run on each turn)
- Update only the specific fields that change, not the entire JSON object.
- Follow the provided mapping logic.
