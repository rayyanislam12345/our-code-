import {useState, useEffect} from "react"

const getStudents = async (classId, setStudents) => {
    const url = `http://127.0.0.1:8000/api/classes/${classId}/roster/`
    const response = await fetch(url);

    if (!response.ok){
        throw new Error(`Response status: ${response.status}`)
    }
    const data = await response.json();
    console.log("Fetched roster:", data);
    setStudents(data || []);

}

const addStudentsToBackend = async (classId, emails) => {
  const url = `http://127.0.0.1:8000/api/classes/${classId}/roster/`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ students: emails }),
  }); 
  if (!response.ok) {
  throw new Error(`Failed to add students: ${response.status}`);
  }
};

const removeStudentsFromBackend = async (classId, email) => {
  const url = `http://127.0.0.1:8000/api/classes/${classId}/roster/`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "remove", student: email }),
  }); 
  if (!response.ok) {
  throw new Error(`Failed to add students: ${response.status}`);
  }
};


function EnrolledStudentsList({classId, user}) {
  const [students, setStudents] = useState([]);
  const [newEmail, setNewEmail] = useState("");

    useEffect(() => {
      if(classId){
          getStudents(classId, setStudents);
          console.log("Fetching roster for classId:", classId);
      }
  }, [classId])

  const handleAddStudent = async () => {
      if (newEmail.trim() == "") return;
      try {
        await addStudentsToBackend(classId, [newEmail]);
        await getStudents(classId, setStudents);
        setNewEmail("")
      } catch (err) {
        console.error("Failed to add student:", err);
        alert("Could not add student. Check backend connection.");
      }
  };

  const handleRemoveStudent = async (emailToRemove) => {
    try { 
      await removeStudentsFromBackend(classId, emailToRemove);
      await getStudents(classId, setStudents);
    } 
    catch (err) {
      console.error("Failed to remove student:", err);
      alert("Could not remove student. Check backend connection.");
    }
  };

  if (!user?.is_teacher) return null;
  console.log("Rendering roster with:", students);



    useEffect(() => {
        if(classId){
            getStudents(classId, setStudents);
        }
    }, [classId])

    

return (
  <div>
    <h3>
      Students Enrolled
    </h3>
    {students.length === 0 ? (
      <p>No students yet.</p>
    ) : (
      <ul>
        {students.map((s, i) => (
          <li key={i}>
            {s.name ? `${s.name} (${s.email})` : s.email}
            <button onClick={() => handleRemoveStudent(s.email)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    )}

    <div>
      <input
        type="email"
        placeholder="Enter student email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
      />
      <button onClick={handleAddStudent}>Add Student</button>
    </div>
  </div>
  );
}



export default EnrolledStudentsList;
