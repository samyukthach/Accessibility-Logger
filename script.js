let issueCatalog = [];

// Load issue catalog on page load
window.addEventListener("DOMContentLoaded", async () => {
  try {
    // Fetching JSON data
    const response = await fetch('issueCatalog.json');
    issueCatalog = await response.json();

    console.log('Issue catalog loaded:', issueCatalog); // Debugging: Log loaded catalog

    // Populate issue type options after catalog is loaded
    populateIssueOptions();

    // Render saved issues on page load (grouped by project)
    renderTablesByProject();

    // Update project input field with existing projects
    updateProjectInputField();

  } catch (err) {
    console.error("Failed to load issue catalog:", err);
  }
});

// Populating the issue type dropdown options
const issueTypeSelect = document.getElementById("issueType");
const issueTable = document.getElementById("issueTable");
const recommendationTextarea = document.getElementById("recommendation");

function populateIssueOptions() {
  issueTypeSelect.innerHTML = ''; // Clear existing options

  const principle = document.getElementById("principleFilter").value;
  const level = document.getElementById("levelFilter").value;

  console.log('Filtering issues by principle and level:', principle, level);

  // Filter and add issue types to the dropdown
  issueCatalog.filter(issue => {
    return (principle === 'all' || issue.principle === principle) &&
           (level === 'all' || issue.level === level);
  }).forEach(issue => {
    const option = document.createElement("option");
    option.value = issue.issueType;
    option.textContent = `${issue.issueType} (${issue.wcag})`;
    issueTypeSelect.appendChild(option);
  });

  updateRecommendation(); // Update recommendation text area based on selected issue
}

function filterIssues() {
  populateIssueOptions(); // Re-populate dropdown when filters change
}

// Update recommendation when an issue type is selected
function updateRecommendation() {
  const selected = issueTypeSelect.value;
  const match = issueCatalog.find(i => i.issueType === selected);
  recommendationTextarea.value = match ? match.recommendation : '';
}

// Log a new issue to the table
function logIssue() {
  const title = document.getElementById("title").value.trim();
  const priority = document.getElementById("priority").value;
  const selected = issueTypeSelect.value;
  const description = document.getElementById("description").value.trim();
  const recommendation = recommendationTextarea.value.trim();
  const screenshot = document.getElementById("screenshot").value.trim();
  const project = document.getElementById("project").value.trim();

  const match = issueCatalog.find(i => i.issueType === selected);

  // Ensure all necessary fields are filled
  if (!title || !project) {
    alert('Please enter a title and project name for the issue.');
    return;
  }

  // Create issue object
  const issue = {
    project,
    title,
    priority,
    issueType: match.issueType,
    impact: match.impact,
    wcag: match.wcag,
    recommendation,
    description,
    screenshot
  };

  // Save issue to localStorage
  let savedIssues = JSON.parse(localStorage.getItem('a11yIssues')) || [];
  savedIssues.push(issue);
  localStorage.setItem('a11yIssues', JSON.stringify(savedIssues));

  // Add the issue to the project-wise table immediately
  appendIssueToTable(issue);

  // Clear input fields after logging
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("screenshot").value = "";
  recommendationTextarea.value = "";

  // Re-render issues grouped by project
  renderTablesByProject();

  // Update project input field with the newly added project
  updateProjectInputField();
}

// Append issue to the table (for a specific project)
function appendIssueToTable(issue, table) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="checkbox" class="issue-checkbox" data-issue-title="${issue.title}"></td>
    <td>${issue.title}</td>
    <td>${issue.priority}</td>
    <td>${issue.issueType}</td>
    <td>${issue.impact}</td>
    <td>${issue.wcag}</td>
    <td>${issue.recommendation}</td>
    <td>${issue.description}</td>
    <td>${issue.screenshot}</td>
    <td><button class="delete-btn" onclick="deleteIssue('${issue.title}')">Delete</button></td>
  `;
  table.appendChild(row);
}

// Render saved issues grouped by project
function renderTablesByProject() {
  const savedIssues = JSON.parse(localStorage.getItem('a11yIssues')) || [];
  const projects = [...new Set(savedIssues.map(i => i.project).filter(p => p))];

  const container = document.getElementById("projectTables");
  container.innerHTML = ""; // Clear the container before re-rendering

  // Add project-wise tables dynamically
  projects.forEach(project => {
    const projectIssues = savedIssues.filter(i => i.project === project);

    const projectHeader = document.createElement("button");
    projectHeader.textContent = `${project} (${projectIssues.length} issues)`;
    projectHeader.classList.add("collapsible");
    container.appendChild(projectHeader);

    const tableDiv = document.createElement("div");
    tableDiv.classList.add("content");
    const table = document.createElement("table");
    table.innerHTML = `
      <tr>
        <th>Select</th>
        <th>Title</th>
        <th>Priority</th>
        <th>Issue Type</th>
        <th>Impact</th>
        <th>WCAG Ref</th>
        <th>Recommendation</th>
        <th>Description</th>
        <th>Screenshot</th>
        <th>Action</th>
      </tr>
    `;

    // Add rows for each issue
    projectIssues.forEach(issue => appendIssueToTable(issue, table));

    tableDiv.appendChild(table);
    container.appendChild(tableDiv);

    // Add button to delete project
    const deleteProjectBtn = document.createElement('button');
    deleteProjectBtn.textContent = 'Delete Project';
    deleteProjectBtn.classList.add('delete-project-btn');
    deleteProjectBtn.onclick = () => deleteProject(project);
    container.appendChild(deleteProjectBtn);

    // Toggle visibility of issues table 
    projectHeader.addEventListener("click", () => {
      tableDiv.style.display = tableDiv.style.display === "none" ? "block" : "none";
     projectHeader.classList.toggle('expanded');  // Toggle the expanded class

    });

    tableDiv.style.display = "none"; // Initially collapsed

  });
}



// Update the project input field to include existing projects
function updateProjectInputField() {
  const savedIssues = JSON.parse(localStorage.getItem('a11yIssues')) || [];
  const projects = [...new Set(savedIssues.map(i => i.project).filter(p => p))];

  const projectInput = document.getElementById("project");
  const projectDatalist = document.getElementById("projects-list");

  projectInput.innerHTML = ""; // Clear the existing options

  // Add the projects to the input field dropdown
  projects.forEach(project => {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    projectDatalist.appendChild(option);
  });
}



// Delete a specific issue
function deleteIssue(title) {
  let savedIssues = JSON.parse(localStorage.getItem('a11yIssues')) || [];

  // Filter out the issue to delete
  savedIssues = savedIssues.filter(issue => issue.title !== title);

  // Save the updated issues back to localStorage
  localStorage.setItem('a11yIssues', JSON.stringify(savedIssues));

  // Remove the issue row from the DOM
  const rowToRemove = document.querySelector(`tr[data-issue-title="${title}"]`);
  if (rowToRemove) {
    rowToRemove.remove();
  }

  // Re-render the issues in the table
  renderTablesByProject();
}

// Delete all selected issues
function deleteSelectedIssues() {
  let savedIssues = JSON.parse(localStorage.getItem('a11yIssues')) || [];
  
  // Get all selected checkboxes
  const selectedCheckboxes = document.querySelectorAll('.issue-checkbox:checked');
  
  const selectedTitles = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.issueTitle);

  // Filter out the selected issues to delete
  savedIssues = savedIssues.filter(issue => !selectedTitles.includes(issue.title));

  // Save the updated issues back to localStorage
  localStorage.setItem('a11yIssues', JSON.stringify(savedIssues));

  // Remove the selected issue rows from the DOM
  selectedCheckboxes.forEach(checkbox => {
    const rowToRemove = checkbox.closest('tr');
    if (rowToRemove) {
      rowToRemove.remove();
    }
  });

  // Re-render the issues in the table
  renderTablesByProject();
}

// Clear all logs
function clearLogs() {
  const confirmClear = confirm("Are you sure you want to clear all logs?");
  if (confirmClear) {
    localStorage.removeItem("a11yIssues");
    document.getElementById("projectTables").innerHTML = ''; // Clear the project tables display
    alert("All logs have been cleared.");
  }
}


// Handle "Select All" checkbox
document.getElementById("select-all").addEventListener("change", (e) => {
  const checkboxes = document.querySelectorAll('.issue-checkbox');
  checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
});


// Export selected issues to CSV
function exportCSV() {
  const selectedCheckboxes = document.querySelectorAll('.issue-checkbox:checked');
  
  // If no issues are selected, alert the user
  if (selectedCheckboxes.length === 0) {
    alert("Please select at least one issue to export.");
    return;
  }

  // Extract the data of the selected issues
  const selectedIssues = Array.from(selectedCheckboxes).map(checkbox => {
    const row = checkbox.closest('tr');  // Get the row containing the checkbox
    const cells = row.querySelectorAll('td');
    return {
      title: cells[1].textContent,  // Title column
      priority: cells[2].textContent,  // Priority column
      issueType: cells[3].textContent,  // Issue Type column
      impact: cells[4].textContent,  // Impact column
      wcag: cells[5].textContent,  // WCAG Ref column
      recommendation: cells[6].textContent,  // Recommendation column
      description: cells[7].textContent,  // Description column
      screenshot: cells[8].textContent  // Screenshot column
    };
  });

  // Define CSV header row
  const header = ["Title", "Priority", "Issue Type", "Impact", "WCAG Ref", "Recommendation", "Description", "Screenshot"];
  
  // Convert selected issues into rows for CSV
  const rows = selectedIssues.map(issue => [
    issue.title,
    issue.priority,
    issue.issueType,
    issue.impact,
    issue.wcag,
    issue.recommendation,
    issue.description,
    issue.screenshot
  ]);

  // Combine header and rows into a CSV string
  const csvContent = [
    header.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  // Create a Blob from the CSV string
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a link element to trigger the download
  const link = document.createElement('a');
  const filename = "exported_issues.csv";  // You can change the filename if needed

  // For Internet Explorer and Edge support
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();  // Trigger the download
  }
}
