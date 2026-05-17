# Wildlife Conservation Monitoring Database Management System

## Project Description

The **Wildlife Conservation Monitoring Database Management System** is a database project designed to help manage and monitor wildlife conservation activities in an organized and efficient way.

The system stores important information about animals, protected zones, rangers, sightings, health records, threats, and users. It helps conservation staff track animal status, record animal sightings, monitor health conditions, and report threats such as poaching, fire, flood, drought, and disease.

This project was implemented using **PostgreSQL / Supabase** as the cloud database platform, with a simple web-based user interface for managing and viewing conservation data.

---

## Course Information

- **University:** Cyprus International University
- **Course:** CMPE344 Database Management Systems and Programming II
- **Term:** Spring 2025–2026
- **Instructor:** Prof. Dr. Melike Şah Direkoğlu
- **Project Topic:** Wildlife Conservation Monitoring Database Management System

---

## Project Members

| Student Number | Student Name | Responsibility |
|---|---|---|
| 22208724 | Mohamed Alfutahi | Introduction and DDL |
| 22118071 | Mohamed Abdelgadir | Entity Relationship Diagram |
| 22204138 | Sufyan Qaid | Data Manipulation Language |
| 22318677 | Osman Salih | PL/SQL Queries |
| 22326910 | Omar Awadh | User Interface / Software |

---

## Main Objectives

The main objectives of this project are:

- To design a database system for wildlife conservation monitoring.
- To store and manage information about animals, zones, rangers, sightings, health records, threats, and users.
- To use primary keys, foreign keys, constraints, and relationships between tables.
- To implement SQL queries that help management analyze conservation data.
- To create procedures, functions, and triggers for database operations.
- To develop a simple graphical user interface that connects to the database.
- To deploy and document the project using GitHub.

---

## Database Tables

The database contains the following main tables:

1. **users**  
   Stores system users and their roles such as admin, ranger, researcher, and viewer.

2. **zones**  
   Stores information about protected areas, including zone name, area size, habitat type, and country.

3. **animals**  
   Stores animal information such as name, species, gender, birth year, status, and assigned zone.

4. **rangers**  
   Stores ranger details and links each ranger to a user account and a protected zone.

5. **sightings**  
   Stores animal sighting records, including the animal seen, user, zone, date, count, and notes.

6. **health_records**  
   Stores animal health check information, including health status, weight, check date, and notes.

7. **threats**  
   Stores reported threats in protected zones, including threat type, severity, report date, and resolved status.

---

## Technologies Used

- PostgreSQL
- Supabase
- SQL
- PL/pgSQL
- HTML
- CSS
- JavaScript
- GitHub

---

## Database Features

This project includes:

- Data Definition Language (DDL)
- Data Manipulation Language (DML)
- Primary keys
- Foreign keys
- Check constraints
- Default values
- Insert, update, and delete operations
- SQL queries for reports and statistics
- Procedures
- Functions
- Triggers

---

## SQL Queries

The project includes several SQL queries to help management understand and analyze the data, such as:

1. Total sightings per animal
2. Number of animals per zone
3. Average weight per species
4. Unresolved high-severity threats
5. Sightings reported by a specific user
6. Sightings searched by zone name
7. Animals not seen in the last 30 days

These queries use SQL concepts such as:

- JOIN
- LEFT JOIN
- GROUP BY
- ORDER BY
- COUNT
- SUM
- AVG
- Subqueries
- WHERE conditions

---

## Procedures, Functions, and Triggers

The project includes the following PL/SQL / PL/pgSQL blocks:

### Procedures

1. **Search sightings by user ID**  
   Finds the number of sightings reported by a specific user.

2. **Search animals by zone name**  
   Searches animals living in a specific protected zone.

3. **Add a new sighting record**  
   Adds a new sighting record after checking if the animal exists.

### Function

1. **Count total sightings for one animal**  
   Returns the total number of sightings recorded for a specific animal.

### Trigger

1. **Auto-update animal status after health check**  
   When a health record is inserted with the status `sick` or `injured`, the trigger automatically updates the animal status to `unknown`.

---

## User Interface

The project includes a simple web-based user interface that allows users to interact with the database.

The user interface includes pages such as:

- Login Page
- Dashboard
- Animals Page
- Sightings Page
- Health Records Page
- Threats Page
- Reports Page

The interface allows users to:

- View records
- Add new records
- Update existing records
- Delete records
- Display useful reports
- Search and filter information

---

## Project Structure

```text
wildlife-conservation-monitoring-db/
│
├── README.md
├── wildlife_conservation.sql
│
├── database/
│   ├── ddl.sql
│   ├── dml.sql
│   ├── queries.sql
│   └── procedures_functions_triggers.sql
│
├── docs/
│   ├── project_report.pdf
│   ├── project_requirement.pdf
│   └── erd.png
│
├── screenshots/
│   ├── login_page.png
│   ├── dashboard.png
│   ├── animals_page.png
│   ├── sightings_page.png
│   ├── health_records_page.png
│   ├── threats_page.png
│   └── reports_page.png
│
└── website/
    ├── index.html
    ├── dashboard.html
    ├── animals.html
    ├── sightings.html
    ├── health.html
    ├── threats.html
    ├── reports.html
    ├── style.css
    └── script.js
```

---

## How to Run the Database

1. Open **Supabase**.
2. Create a new project.
3. Open the **SQL Editor**.
4. Copy and run the SQL code from `wildlife_conservation.sql`.
5. Make sure all tables are created successfully.
6. Insert the sample data.
7. Run the queries, procedures, functions, and triggers for testing.

---

## How to Run the User Interface

1. Open the `website` folder.
2. Open `index.html` in a browser.
3. Connect the JavaScript files to the Supabase project.
4. Test the pages by adding, updating, deleting, and viewing records.

---

## Screenshots

The `screenshots` folder contains screenshots of the working application interface, including:

- Login page
- Dashboard
- Animals page
- Sightings page
- Health records page
- Threats page
- Reports page

---

## GitHub Repository

This repository contains all project files, including:

- Database SQL scripts
- ERD diagram
- DDL and DML files
- SQL queries
- Procedures, functions, and triggers
- GUI implementation code
- Project report
- Screenshots
- Documentation

---

## Conclusion

The Wildlife Conservation Monitoring Database Management System provides a simple and organized solution for managing wildlife conservation data. It supports animal tracking, zone management, ranger records, health monitoring, threat reporting, and management reports.

The project demonstrates the use of database design, SQL implementation, relationships, constraints, PL/SQL blocks, and a working user interface connected to a cloud database.
