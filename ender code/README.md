# The Main Branch Code Review

This project is a simple code peer review system.
The goal is to let people share their code and review each other’s work, kind of like what happens during group projects when everyone checks each other’s code before submitting.

We’re starting from the whale_headed_stork.

## How to run it
1. Clone the repo
git clone https://github.com/your-username/the-main-branch-code-review.git
cd the-main-branch-code-review

2. Switch to the right branch
git checkout whale_headed_stork

3. Install everything you need
cd backend
pip install -r requirements.txt
cd ../frontend
npm install

4. Run the project
### backend
cd backend
python manage.py runserver

### frontend (in another terminal)
cd frontend
npm start

then open http://localhost:3000
 to see it.

## Project structure
the-main-branch-code-review/
│
├── backend/        # django backend
├── frontend/       # react + vite frontend
├── design_docs/    # planning files
├── TeamContract.md
└── README.md

## How it works
- Users can upload or paste code
- Others can leave comments or feedback
- Everyone can see the reviews and learn from them

## How to contribute

1. Make a new branch
git checkout -b branch-name

2. Do your modifications

3. Commit and push
git commit -m "your commit message goes here"  
git push origin branch-name

4. Make a pull request so others can review your code

Markdown cheat sheet: <https://www.markdownguide.org/cheat-sheet/>


DEMO INSTRUCTIONS
------------------------

1. Log in as mcgonagall@union.edu (professor)
2. Go to CSC 106
3. Go to “Current Assignment”
4. Note student statistics - if you would like, you can check the backend and manually confirm that these statistics are correct (Some submissions are not attached to students in groups, and thus their submission does not appear when you click “View Details”)
5. Click “View Details”
6. Clicking on a student's name displays that student’s comment history across the course
    a. Navigate to Elodie’s submission
    b. Click on Elodie’s username
    c. Elodie’s course comment history will now be displayed.
    d. Click on any comment to be redirected to the submission/line where the comment was made. 
7. Create a class
    a. Navigate to the home page or Assignment view page.
    b. Click on the “+ Add a class” button in the sidebar
    c. Enter class details
    d. Click the “Add Course” button
    e. Newly made class should appear in sidebar and on ClassView page (may require reload)
8. Sidebar
    a. Can be used to navigate to classes and assignments
9. Remove a class
    a. Click on a course you wish to delete
    b. Click the red Delete Course button next to Add Assignment at the top of the screen
    c. Click ok
10. Add students to the class:
    a. Choose a class (“CSC-106”)
    b. Type in an email in the placeholder
    c. Click “Add student”
    d. The newly added student should appear in the enrolled students list
11. Remove students
    a. Choose a class (“CSC-106”)
    b. Look at the list of enrolled students
    c. Click “remove student” for the chosen student
    d. The student’s name should now go away
12. Create an assignment
    a. Click on CSC-106
    b. Click the “Add Assignment” button
    c. Enter assignment details
    d. Click the “Create” button
    e. The newly made assignment should appear on the Assignment view page of the related course.
13. Remove an assignment
    a. Click on CSC-106
    b. Click on the assignment you want to delete 
    c. Click on the red Delete Assignment button at the top left of the screen
    d. Click ok
12. Create groups manually:
    a. Click on CSC-106
    b. Click an assignment
    c. Click Create Group
    d. type in a student’s email
    e. Click on the student’s email as it shows up below
    f. Repeat for everyone needed in the group
    g. Click Create Group
13. Create random groups:
    a. Click on CSC-106
    b. Click an assignment
    c. Click auto-create random groups
    d. Type in the number of students in each group when it shows up in the pop-up
    e. Click ok
    f. Refresh the page to see the new groups
14. Extend deadline
    a. Click on CSC-106
    b. Click the “Extend Submission Deadline” button in the Current Assignment box.
    c. Click “apply to entire class”
    d. Enter valid deadline date/time.
    e. Click “Save Extension” button
15. Extend the deadline for individual students
    a. Click on CSC-106
    b. Click the “Extend Submission Deadline” button in the Current Assignment box.
    c. Choose the desired users in list.
    d. Enter valid deadline date/time.
    e. Click “Save Extension” button
16. See all the comments a student has made
    a. Navigate to CSC-106then click on View Group
    b. Go to Current Assignment, and view Elodie’s group
    c. Click on Elodie’s username.
    d. A page displaying Elodie’s past comments will be displayed.
    e. Click on any given comment. 
    f. You will be redirected to that comment in that submission’s page.
19. Stay logged in as the professor or log out and log in as elodie@union.edu to test the following features
    a. If you wish to log out, click on the circle on the right side of the top bar, and click log out
20. We can leave a comment
    a. Navigate to CSC-106, then go to Current Assignment
    b. If logged in as a professor, click on View Group and click on Valentina
    c. If logged in as a student, click on See Peers’ comments
    d. Highlight the line of code you want to leave a comment on, then click the plus sign
    e. A text box should show up, type in your comment then click submit
    f. The comment should appear on the right with the name of the of the current logged-in user on top
    g. Note: a student can only make comments before the deadline. Use the admin backend panel to change the deadline to test for the students 
21. Reply to a comment
    a. Click on the reply button under the comment you want to reply to
    b. The steps will be similar to making a new comment
    c. Note: a student can only reply to comments before the deadline. Use the admin backend panel to change the deadline to test for the students 
22. Edit a comment
    a. Click on the edit button associated with the comment you want to edit
    b. The steps will be similar to making a new comment
    c. Both professors and students can only edit the comments they made
    d. Note: a student can only edit comments before the deadline. Use the admin backend panel to change the deadline to test for the students 
23. Delete a comment
    a. Click on the delete button associated with the comment you want to delete
    b. If the comment has replies, it will be “soft-deleted.” The original comment will be replaced with the text [removed]
    c. If the comment has no replies, it will be removed from the screen
    d. A professor can delete anyone’s comments, but a student can only delete their own comments
    e. Note: a student can only delete comments before the deadline. Use the admin backend panel to change the deadline to test for the students 
