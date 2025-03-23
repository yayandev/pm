"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/firebaseConfig.js";
import { useAuth } from "@/context/authContext";
import Image from "next/image";
import { FaTrash, FaUserPlus } from "react-icons/fa";

// Invite Modal Component
const InviteModal = ({ projectId, isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      // Check if email already exists in members
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        const members = projectData.members || [];

        if (members.includes(email)) {
          setError("This email is already a team member");
          setIsSubmitting(false);
          return;
        }

        // Add the email to members array
        await updateDoc(projectRef, {
          members: arrayUnion(email),
        });

        setSuccess(`Invitation sent to ${email}`);
        setEmail("");

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccess("");
        }, 2000);
      }
    } catch (error) {
      console.error("Error inviting team member:", error);
      setError("Failed to send invitation. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Invite Team Member</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="text"
              id="email"
              placeholder="colleague@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

          {success && (
            <div className="mb-4 text-sm text-green-600">{success}</div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
              ) : (
                <FaUserPlus className="mr-2" />
              )}
              Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Task component with drag functionality
const Task = ({ task, index, moveTask, status }) => {
  const ref = React.useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: { id: task.id, status, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "TASK",
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceStatus = item.status;
      const targetStatus = status;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex && sourceStatus === targetStatus) {
        return;
      }

      // Call the move function to update task positions
      moveTask(item.id, sourceStatus, targetStatus, dragIndex, hoverIndex);

      // Update the index and status for the dragged item
      item.index = hoverIndex;
      item.status = targetStatus;
    },
  });

  drag(drop(ref));

  // Apply styles based on status
  const getStatusStyles = () => {
    switch (status) {
      case "pending":
        return "border-yellow-200 bg-yellow-50";
      case "ongoing":
        return "border-blue-200 bg-blue-50";
      case "completed":
        return "border-green-200 bg-green-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const handleDeleteTask = async () => {
    // Confirm before deleting
    if (confirm(`Are you sure you want to delete the task "${task.name}"?`)) {
      try {
        // Get the project from Firestore
        const projectId = window.location.pathname.split("/").pop();
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const projectData = projectDoc.data();

          // Filter out the task to be deleted
          const updatedTasks = projectData.tasks.filter(
            (t) => t.id !== task.id
          );

          // Calculate new progress
          const completedTasks = updatedTasks.filter(
            (t) => t.status === "completed"
          ).length;
          const progress =
            updatedTasks.length > 0
              ? Math.round((completedTasks / updatedTasks.length) * 100)
              : 0;

          // Get project status based on new progress
          const getProjectStatus = (progress) => {
            if (progress === 0) return "Not Started";
            if (progress < 50) return "In Progress";
            if (progress < 100) return "Nearly Complete";
            return "Completed";
          };

          // Update project in Firestore
          await updateDoc(projectRef, {
            tasks: updatedTasks,
            progress: progress,
            status: getProjectStatus(progress),
            updatedAt: serverTimestamp(),
          });

          // Success feedback
          console.log(`Task "${task.name}" deleted successfully`);
        }
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task. Please try again.");
      }
    }
  };

  return (
    <div
      ref={ref}
      className={`p-3 mb-2 border rounded-lg ${getStatusStyles()} ${
        isDragging ? "opacity-50" : "opacity-100"
      } cursor-move`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex gap-1">
          <Image
            alt="user-image"
            src={task.user.avatar}
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="ml-2">{task.name}</span>
        </div>
        <button
          onClick={handleDeleteTask}
          className="cursor-pointer text-red-500"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

// Column component for each status
const TaskColumn = ({ status, tasks, moveTask }) => {
  const [, drop] = useDrop({
    accept: "TASK",
    drop: (item) => {
      // Handle when a task is dropped but not on another task
      if (item.status !== status) {
        moveTask(item.id, item.status, status, item.index, tasks.length);
      }
    },
  });

  // Get title and styling based on status
  const getColumnTitle = () => {
    switch (status) {
      case "pending":
        return "Pending";
      case "ongoing":
        return "Ongoing";
      case "completed":
        return "Completed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getColumnStyles = () => {
    switch (status) {
      case "pending":
        return "border-yellow-300 bg-yellow-50";
      case "ongoing":
        return "border-blue-300 bg-blue-50";
      case "completed":
        return "border-green-300 bg-green-50";
      default:
        return "border-gray-300 bg-white";
    }
  };

  return (
    <div
      ref={drop}
      className={`flex-1 p-4 rounded-lg border ${getColumnStyles()}`}
    >
      <h3 className="font-medium mb-3">
        {getColumnTitle()} ({tasks.length})
      </h3>
      <div className="min-h-40">
        {tasks.map((task, index) => (
          <Task
            key={task.id}
            task={task}
            index={index}
            moveTask={moveTask}
            status={status}
          />
        ))}
      </div>
    </div>
  );
};

// Access Control Component
const ProjectAccessControl = ({ children, projectId, currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  React.useEffect(() => {
    const checkAccess = async () => {
      if (!projectId || !currentUser) {
        setLoading(false);
        setHasAccess(false);
        return;
      }

      try {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          const members = projectData.members || [];

          // Check if current user's email is in the members list
          const userHasAccess = members.includes(currentUser.email);

          setHasAccess(userHasAccess);
        } else {
          setError("Project not found");
        }
      } catch (error) {
        console.error("Error checking project access:", error);
        setError("Failed to verify access permissions");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [projectId, currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <div className="text-red-500 text-xl font-semibold mb-2">Error</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => router.push("/projects")}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-8">
        <div className="text-red-500 text-5xl mb-4">
          <svg
            className="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600 text-center mb-4">
          You do not have permission to access this project. Please contact the
          project owner to request access.
        </p>
        <button
          onClick={() => router.push("/projects")}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return children;
};

// ProjectDetailPage component
const ProjectDetailPage = () => {
  const [project, setProject] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  useEffect(() => {
    // Set up real-time listener when component mounts
    if (projectId) {
      const unsubscribe = setupRealTimeListener(projectId);

      // Clean up listener when component unmounts
      return () => unsubscribe();
    }
  }, [projectId]);

  // Set up real-time listener for project updates
  const setupRealTimeListener = (id) => {
    setLoading(true);

    const projectRef = doc(db, "projects", id);

    // onSnapshot creates a real-time listener that updates when data changes
    const unsubscribe = onSnapshot(
      projectRef,
      // Success handler
      (projectDoc) => {
        if (projectDoc.exists()) {
          const projectData = {
            id: projectDoc.id,
            ...projectDoc.data(),
            dueDate: projectDoc.data().dueDate ? projectDoc.data().dueDate : "",
          };

          setProject(projectData);
          setProjectName(projectData.name);
          setProjectDesc(projectData.description || "");
        } else {
          console.log("Project not found");
          // Navigate back to projects page if project doesn't exist
          //   router.push("/projects");
          setProject(null);
          setProjectName("");
          setProjectDesc("");
        }
        setLoading(false);
      },
      // Error handler
      (error) => {
        console.error("Error listening to project:", error);
        setLoading(false);
      }
    );

    // Return the unsubscribe function
    return unsubscribe;
  };

  // Update project in Firebase
  const updateProject = async (updatedData) => {
    try {
      const projectRef = doc(db, "projects", projectId);
      const dataToUpdate = {
        ...updatedData,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(projectRef, dataToUpdate);

      // Update local state
      setProject((prevProject) => ({
        ...prevProject,
        ...updatedData,
      }));

      return true;
    } catch (error) {
      console.error("Error updating project:", error);
      return false;
    }
  };

  // Update project name
  const handleUpdateName = async () => {
    if (!project || projectName === project.name) return;

    try {
      await updateProject({ name: projectName });
    } catch (error) {
      console.error("Error updating project name:", error);
      // Reset to previous name on error
      setProjectName(project.name);
    }
  };

  //update project desc
  const handleUpdateDesc = async () => {
    if (!project || projectDesc === project.description) return;
    try {
      await updateProject({ description: projectDesc });
    } catch (error) {
      console.error("Error updating project desc:", error);
      setProjectDesc(project.description || "");
    }
  };
  // Add new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim() || !project) return;

    const newTask = {
      id: Date.now().toString(), // Simple ID generation
      name: newTaskName,
      status: newTaskStatus,
      createdAt: new Date().toISOString(),
      user: {
        name: currentUser.displayName,
        email: currentUser.email,
        avatar: currentUser.photoURL,
      },
    };

    const updatedTasks = [...(project.tasks || []), newTask];
    const progress = updateProjectProgress(project.id, updatedTasks);

    // Update project in Firebase
    const success = await updateProject({
      tasks: updatedTasks,
      progress,
    });

    if (success) {
      setNewTaskName("");
    }
  };

  // Update project progress
  const updateProjectProgress = (projectId, tasks) => {
    // Calculate progress based on completed tasks
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const progress =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return progress;
  };

  // Move task between statuses
  const moveTask = async (
    taskId,
    sourceStatus,
    targetStatus,
    sourceIndex,
    targetIndex
  ) => {
    if (!project) return;

    // Find the task and update its status
    const updatedTasks = [...project.tasks];
    const taskIndex = updatedTasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) return;

    // Update the task status
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      status: targetStatus,
    };

    // Calculate new progress
    const progress = updateProjectProgress(project.id, updatedTasks);

    // Update project with new tasks and progress
    await updateProject({
      tasks: updatedTasks,
      progress,
      status: getProjectStatus(progress),
    });
  };

  // Get project status based on progress
  const getProjectStatus = (progress) => {
    if (progress === 0) return "Not Started";
    if (progress < 50) return "In Progress";
    if (progress < 100) return "Nearly Complete";
    return "Completed";
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get progress bar color based on progress value
  const getProgressColor = (progress) => {
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-yellow-500";
    if (progress < 75) return "bg-blue-500";
    return "bg-green-500";
  };

  //handle delete project
  const handleDeleteProject = async () => {
    if (!projectId) return;
    try {
      if (confirm("Apakah anda yakin mau menghapus project?")) {
        await deleteDoc(doc(db, "projects", projectId));
        router.push("/projects");
      }
    } catch (error) {
      console.log("Error deleting project:", error);
    }
  };

  // Navigate back to projects page
  const handleBackToProjects = () => {
    router.push("/projects");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 mb-4">Project not found</p>
        <button
          onClick={handleBackToProjects}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <ProjectAccessControl projectId={projectId} currentUser={currentUser}>
      <DndProvider backend={HTML5Backend}>
        <div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center">
                <button
                  onClick={handleBackToProjects}
                  className="mr-2 text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    ></path>
                  </svg>
                </button>
                <input
                  type="text"
                  value={projectName}
                  className="text-xl font-bold p-1 border border-transparent focus:border-gray-300 rounded"
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={handleUpdateName}
                />
              </div>
              <div className="flex gap-2 items-start">
                <textarea
                  className="text-gray-600 mt-1 p-1 sm:w-96 w-full"
                  onChange={(e) => setProjectDesc(e.target.value)}
                  onBlur={handleUpdateDesc}
                  value={projectDesc}
                />
                <button
                  onClick={handleDeleteProject}
                  className="py-2 px-3 rounded text-sm text-white bg-red-500 font-semibold"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  project.progress < 25
                    ? "bg-red-100 text-red-800"
                    : project.progress < 50
                    ? "bg-yellow-100 text-yellow-800"
                    : project.progress < 100
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {project.status}
              </span>

              {/* Invite Team Button */}
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center text-sm"
              >
                <FaUserPlus className="mr-1" />
                Invite Team
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Due Date
              </div>
              <div className="text-lg font-semibold text-gray-800">
                {project.dueDate && formatDate(project.dueDate)}
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Progress
              </div>
              <div className="flex items-center">
                <div className="text-lg font-semibold text-gray-800 mr-3">
                  {project.progress}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`${getProgressColor(
                      project.progress
                    )} h-2.5 rounded-full`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Team Members
              </div>
              <div className="flex">
                <div className="overflow-y-auto">
                  {project.members && project.members.length > 0 ? (
                    project.members.map((member, index) => (
                      <p className="text-sm" key={index}>
                        {member}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No team members yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Task Board with Drag and Drop */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tasks</h3>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Pending Column */}
              <TaskColumn
                status="pending"
                tasks={
                  project.tasks
                    ? project.tasks.filter((t) => t.status === "pending")
                    : []
                }
                moveTask={moveTask}
              />

              {/* Ongoing Column */}
              <TaskColumn
                status="ongoing"
                tasks={
                  project.tasks
                    ? project.tasks.filter((t) => t.status === "ongoing")
                    : []
                }
                moveTask={moveTask}
              />

              {/* Completed Column */}
              <TaskColumn
                status="completed"
                tasks={
                  project.tasks
                    ? project.tasks.filter((t) => t.status === "completed")
                    : []
                }
                moveTask={moveTask}
              />
            </div>
          </div>

          <form
            onSubmit={handleAddTask}
            className="flex flex-col md:flex-row gap-2"
          >
            <input
              type="text"
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg md:rounded-l-lg md:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg md:rounded-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              value={newTaskStatus}
              onChange={(e) => setNewTaskStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg md:rounded-r-lg md:rounded-l-none"
            >
              Add
            </button>
          </form>

          {/* Invite Modal */}
          <InviteModal
            projectId={projectId}
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
          />
        </div>
      </DndProvider>
    </ProjectAccessControl>
  );
};

export default ProjectDetailPage;
