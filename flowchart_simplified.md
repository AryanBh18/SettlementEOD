# Settlement EOD System - Flowchart

```mermaid
flowchart TD
    Start([START])
    Login[Login]
    AuthCheck{Auth OK?}
    Dashboard[Dashboard]
    MainDecision{Run EOD?}
    SimDecision{Simulate?}
    Generate[Generate Test Data]
    CutoffDecision{Cutoff?}
    Notify[Notify Banks]
    AlreadyDone{Already Processed?}
    EODSteps["📊 EOD Processing<br/>1. Fetch Transactions<br/>2. Calculate Positions<br/>3. Settlement Orders<br/>4. Generate File<br/>5. Bilateral Settlement<br/>6. Validate Results"]
    ValidationCheck{All Checks Passed?}
    Success["✓ SUCCESS"]
    Failed["✗ FAILED"]
    SaveDB[Save to DB]
    ViewResults[View Results]
    ExportDecision{Export?}
    ExportFile[CSV / NSI File]
    End([END])
    
    Start --> Login
    Login --> AuthCheck
    AuthCheck -->|No| Login
    AuthCheck -->|Yes| Dashboard
    
    Dashboard --> MainDecision
    MainDecision -->|Yes| AlreadyDone
    MainDecision -->|No| SimDecision
    
    SimDecision -->|Yes| Generate
    Generate --> CutoffDecision
    SimDecision -->|No| CutoffDecision
    
    CutoffDecision -->|Yes| Notify
    Notify --> End
    CutoffDecision -->|No| End
    
    AlreadyDone -->|No| EODSteps
    AlreadyDone -->|Yes| ViewResults
    
    EODSteps --> ValidationCheck
    ValidationCheck -->|Yes| Success
    ValidationCheck -->|No| Failed
    
    Success --> SaveDB
    Failed --> SaveDB
    
    SaveDB --> ViewResults
    ViewResults --> ExportDecision
    
    ExportDecision -->|Yes| ExportFile
    ExportDecision -->|No| End
    ExportFile --> End
    
    style Start fill:#1e293b,color:#fff,stroke:#333
    style End fill:#475569,color:#fff,stroke:#333
    style Success fill:#86efac,stroke:#333
    style Failed fill:#fca5a5,stroke:#333
    style EODSteps fill:#3b82f6,color:#fff,stroke:#333
    style Dashboard fill:#dbeafe,stroke:#333
    style ViewResults fill:#dbeafe,stroke:#333
    style SaveDB fill:#dbeafe,stroke:#333
    style Generate fill:#dbeafe,stroke:#333
    style Notify fill:#dbeafe,stroke:#333
    style ExportFile fill:#dbeafe,stroke:#333
    style MainDecision fill:#fef3c7,stroke:#333
    style AuthCheck fill:#fef3c7,stroke:#333
    style SimDecision fill:#e0e7ff,stroke:#333
    style CutoffDecision fill:#e0e7ff,stroke:#333
    style AlreadyDone fill:#fef3c7,stroke:#333
    style ValidationCheck fill:#fed7aa,stroke:#333
    style ExportDecision fill:#e0e7ff,stroke:#333
```

## How to Use

**In GitHub/GitLab:**
- Just view this `.md` file and Mermaid will render automatically

**In Notion/Obsidian/other Markdown editors:**
- Copy the code block above into your editor

**Online:**
- Paste the code at [mermaid.live](https://mermaid.live)

**In your documentation:**
- Embed in any Markdown-supporting tool that has Mermaid rendering enabled
