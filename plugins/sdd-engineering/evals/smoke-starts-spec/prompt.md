---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Agent]
tags: [smoke]
---

I want to build a user notifications feature spec-first: users get in-app and email notifications when someone comments on their post, can mark them read, and can mute a thread. It touches the API, the database, the web client and the email worker. Let's do it with SDD.
