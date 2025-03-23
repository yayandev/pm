"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebaseConfig.js";
import { useAuth } from "@/context/authContext";

// Status summary calculation
const calculateStatusSummary = (projects) => {
  const summary = {
    total: projects.length,
    notStarted: 0,
    inProgress: 0,
    nearlyComplete: 0,
    completed: 0,
  };

  projects.forEach((project) => {
    if (project.progress === 0) summary.notStarted++;
    else if (project.progress < 50) summary.inProgress++;
    else if (project.progress < 100) summary.nearlyComplete++;
    else summary.completed++;
  });

  return summary;
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    github: "",
    description: "",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days from now
  });
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Fetch projects from Firebase when component mounts
    fetchProjects();
  }, [currentUser]);

  // Fetch all projects from Firebase
  const fetchProjects = async () => {
    setLoading(true);
    try {
      if (!currentUser || !currentUser.email) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const projectsCollection = collection(db, "projects");

      // Get only projects where the logged-in user is a member
      const q = query(
        projectsCollection,
        where("members", "array-contains", currentUser.email)
      );

      const projectsSnapshot = await getDocs(q);
      const projectsList = projectsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate ? doc.data().dueDate : "",
      }));

      setProjects(projectsList);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for the new project form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create a new project in Firebase
  const createProject = async (e) => {
    e.preventDefault();
    try {
      // Default new project data
      const newProjectData = {
        name: newProject.name || "New Project",
        description: newProject.description || "Project description goes here",
        progress: 0,
        status: "Not Started",
        dueDate: newProject.dueDate,
        members: [currentUser?.email],
        tasks: [],
        github: newProject?.github,
      };

      const projectsRef = collection(db, "projects");
      const projectToAdd = {
        ...newProjectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(projectsRef, projectToAdd);

      // Reset form and close modal
      setNewProject({
        name: "",
        description: "",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
      setShowModal(false);

      // Refresh projects list
      fetchProjects();

      // Navigate to the new project detail page
      router.push(`/projects/${docRef.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  // Navigate to project detail
  const handleProjectSelect = (projectId) => {
    router.push(`/projects/${projectId}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
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

  const statusSummary = calculateStatusSummary(projects);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Project Management
          </h1>
          <p className="text-gray-600">Manage your team projects and tasks</p>
        </div>
        <button
          className="mt-4 lg:mt-0 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
          onClick={() => setShowModal(true)}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          New Project
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                ></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">
                Total Projects
              </h2>
              <p className="text-2xl font-bold text-gray-800">
                {statusSummary.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">In Progress</h2>
              <p className="text-2xl font-bold text-gray-800">
                {statusSummary.inProgress}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">
                Nearly Complete
              </h2>
              <p className="text-2xl font-bold text-gray-800">
                {statusSummary.nearlyComplete}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Completed</h2>
              <p className="text-2xl font-bold text-gray-800">
                {statusSummary.completed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-3 text-center py-10">
              <p className="text-gray-500 mb-4">No projects found</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Create Your First Project
              </button>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProjectSelect(project.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {project.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
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
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="mb-3">
                  <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getProgressColor(
                        project.progress
                      )} h-2 rounded-full`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {project.members &&
                      project.members.slice(0, 3).map((member, index) => (
                        <div key={index} className="text-sm">
                          {member.slice(0, 5)}...
                        </div>
                      ))}
                    {project.members && project.members.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-500">
                    {project.dueDate && `Due: ${formatDate(project.dueDate)}`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Create New Project
              </h3>
              <button
                onClick={() => setShowModal(false)}
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

            <form onSubmit={createProject} className="p-5">
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-medium mb-2"
                  htmlFor="name"
                >
                  Project Name
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-medium mb-2"
                  htmlFor="github"
                >
                  Github Repo
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="github"
                  name="github"
                  type="url"
                  placeholder="Enter project repo"
                  value={newProject.github}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-medium mb-2"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="description"
                  name="description"
                  rows="3"
                  placeholder="Enter project description"
                  value={newProject.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-medium mb-2"
                  htmlFor="dueDate"
                >
                  Due Date
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={newProject.dueDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
