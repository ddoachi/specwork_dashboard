# 📊 Spec Dashboard

> Auto-generated from spec files on {{calculated.lastUpdated}}

## 🎯 Quick Stats

- **Total Epics**: {{stats.total_epics}}
- **Total Features**: {{stats.total_features}}
- **Total Tasks**: {{stats.total_tasks}}
- **Completed**: {{stats.completed.length}} 🔥
- **In Progress**: {{stats.in_progress.length}}
- **Overall Progress**: {{calculated.progressPercentage}}%

## 🚀 Progress

```
Progress Bar: [{{calculated.progressBar}}] {{calculated.progressPercentage}}%
Completed: {{stats.completed.length}}/{{calculated.totalSpecs}}
```

## 📁 Specifications

{{#each hierarchy}}
### {{statusIcon status}} [{{@key}} - {{title}}]({{@key}}/spec.md)

> Status: `{{status}}` | Priority: `{{priority}}`

{{#if features}}
{{#each features}}
- {{statusIcon status}} [{{@key}} - {{title}}]({{../key}}/{{@key}}/spec.md) `{{status}}`
  {{#each tasks}}
  - {{statusIcon status}} [{{@key}} - {{title}}]({{../../key}}/{{../key}}/{{@key}}/spec.md)
  {{/each}}
{{/each}}
{{/if}}

{{/each}}

---
*Generated automatically by GitHub Actions*