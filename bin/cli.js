#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const inquirer = require("inquirer")

async function init() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What is the project name?"
    },
    {
      type: "input",
      name: "description",
      message: "What is your project's description?"
    },
    {
      type: "confirm",
      name: "useEslint",
      message: "Use 10x ESLint config?"
    },
    {
      type: "input",
      name: "keywords",
      message: "Keywords (comma separated):",
      filter: (input) => {
        if (!input) return []
        return input.split(",").map(s => s.trim())
      }
    },
    {
      type: "input",
      name: "author",
      message: "Author name:"
    },
    {
      type: "input",
      name: "main",
      message: "Main entry point:",
      default: "index.js"
    },
    {
      type: "input",
      name: "repository",
      message: "GitHub repository (e.g. your-username/your-project):",
      filter: (input) => {
        if (input && !input.startsWith("https://github.com/")) {
          return `https://github.com/${input}`
        }
        return input
      }
    }
  ])

  const templateName = answers.useEslint ? "template-ninja" : "template"
  const templateDir = path.join(__dirname, "..", templateName)
  const targetDir = process.cwd()
  const currentYear = new Date().getFullYear()

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const files = fs.readdirSync(templateDir)

  // Mapping for specific file renames
  const renameMap = {
    "npmrc.npmrc": ".npmrc",
    "gitignore.gitignore": ".gitignore",
    "gitignore": ".gitignore" // Kept your original logic for safety
  }

  for (const file of files) {
    const srcPath = path.join(templateDir, file)
    const destFileName = renameMap[file] || file
    const destPath = path.join(targetDir, destFileName)
    
    let content = fs.readFileSync(srcPath, "utf8")

    // Replacements
    content = content.replace(/\{\{projectName\}\}/g, answers.projectName)
    content = content.replace(/\{\{description\}\}/g, answers.description)
    content = content.replace(/\{\{author\}\}/g, answers.author)
    content = content.replace(/\{\{main\}\}/g, answers.main)
    content = content.replace(/\{\{repository\}\}/g, answers.repository)
    content = content.replace(/\{\{year\}\}/g, currentYear)
    content = content.replace(/"\{\{keywords\}\}"/g, JSON.stringify(answers.keywords))

    fs.writeFileSync(destPath, content)
    console.log(`Created ${destFileName}`)
  }

  console.log("\nInstalling dependencies...")
  
  try {
    execSync("npm install", { stdio: "inherit", cwd: targetDir })
    console.log("\n10xly project initialized and dependencies installed successfully.")
  } catch (err) {
    console.error("\nFailed to install dependencies. Please run 'npm install' manually.")
  }
}

init().catch(err => {
  console.error(err)
  process.exit(1)
})