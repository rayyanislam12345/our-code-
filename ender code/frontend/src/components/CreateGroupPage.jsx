import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const getStudents = async (classId, setStudents) => {
  const url = `http://127.0.0.1:8000/api/classes/${classId}/roster/`;
  console.log("Fetching from:", url);


  try {
    const response = await fetch(url);
    console.log("Response status:", response.status);
    
    
    const data = await response.json();
    console.log("📋 Class roster (students in this class):");
    data.forEach((s, i) => console.log(`${i + 1}. ${s.name} (${s.email})`));
    
    console.log("Fetched data:", data);
    setStudents(data || []);
  } catch (error) {
    console.error("Error fetching students:", error);
  }
};

const createGroupInBackend = async (assignmentId, selectedStudents, allStudents) => {
  const studentEmails = allStudents
    .filter(s => selectedStudents.includes(s.email))
    .map(s => s.email);
  console.log("Sending to backend:", studentEmails);

  const url = `http://127.0.0.1:8000/api/assignments/${assignmentId}/groups/`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ students: studentEmails }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error:", errorText);
    throw new Error(`Failed to create group: ${response.status}`);
  }

  const data = await response.json();
  console.log("Group created:", data);
  return data;
};

export default function CreateGroupPage() {
  const location = useLocation();
  const assignmentId = location.state?.assignmentId;
  const classId = location.state?.classId;
  const user = location.state?.user;

  const [message, setMessage] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  console.log("classId value in CreateGroupPage:", classId);

  useEffect(() => {
    if (classId) {
      getStudents(classId, setStudents);
      console.log("🟩 Step 1: classId detected:", classId);
    }  else {
    console.log("🟥 Step 1: classId missing! No fetch made");
    }
}, [classId]);

  useEffect(() => {
  console.log("Students state updated in React:", students);
  }, [students]);

  useEffect(() => {
  console.log("All students:", students);
  console.log("Search term:", searchTerm);
  const filtered = students.filter((s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log("Filtered students:", filtered);
    setFilteredStudents(filtered);
    }, [searchTerm, students]);

  const handleCreateGroup = async () => {
  if (selectedStudents.length === 0) {
    setMessage("Please select at least one student.");
    return;
  }

  try {
    const data = await createGroupInBackend(assignmentId, selectedStudents, students);
    setMessage(`Group created successfully! Group ID: ${data[data.length - 1]?.id}`);

    setSelectedStudents([]); 
  } catch (err) {
    console.error("Failed to create group:", err);
    setMessage("Error creating group. Please try again.");
  }
};


  return (
    <div>
<h3>Choose Students for the New Group</h3>

      <input type = "text" placeholder="Type to search..." 
      value = {searchTerm} onChange={ (e) => setSearchTerm(e.target.value)}/>

      {searchTerm && filteredStudents.length > 0 && (
        <ul>
          {filteredStudents.map((s) => (
            <li
              key={s.id}
              onClick={() => {
                setSelectedStudents((prev) =>
                  prev.includes(s.email)
                    ? prev.filter((email) => email !== s.email)
                    : [...prev, s.email]
                );
              }}
            >
              {s.name ? `${s.name} (${s.email})` : s.email}
            </li>
          ))}
        </ul>
      )}

      <div>
        <p>Selected Students:</p>{" "}
        {selectedStudents.length > 0
          ? selectedStudents.join(", ")
          : "None"}

        <div>
<button onClick={handleCreateGroup}>Create Group</button>
        </div>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
