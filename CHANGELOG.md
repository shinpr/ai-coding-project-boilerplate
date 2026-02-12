# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `npx create-ai-project update` command to update agent definitions, commands, skills, and AI rules in existing projects
- `.create-ai-project.json` manifest file for version tracking
- Ignore mechanism (`--ignore`, `--unignore`) to protect user-customized files from being overwritten
- `--dry-run` flag to preview updates without applying changes
- This CHANGELOG file

## [1.14.15] - 2026-02-12

### Added
- Bash tool added to 11 agents requiring shell execution

### Changed
- Six design document quality improvements

## [1.14.0] - 2026-02-04

### Added
- `/update-doc` command for updating existing design documents with review
- Multi-language support (English/Japanese) with copy-based switching
- 23 specialized sub-agents for different development roles
- 13 reusable skill modules
- 18 slash commands for workflow automation
