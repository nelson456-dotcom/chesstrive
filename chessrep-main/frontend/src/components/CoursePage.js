import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // In a real application, you would fetch course data from an API
    // For now, we'll simulate fetching data
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (courseId) {
        setCourseData({
          id: courseId,
          title: `Course: ${courseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
          description: `This is a placeholder for the ${courseId.replace(/-/g, ' ')} course. Details about its content, lines, and lessons would go here.`,
          lessons: [
            { id: 'lesson-1', title: 'Introduction', content: 'Content for introduction' },
            { id: 'lesson-2', title: 'Basic Concepts', content: 'Content for basic concepts' },
          ],
        });
        setLoading(false);
      } else {
        setError('Course not found.');
        setLoading(false);
      }
    }, 500);
  }, [courseId]);

  if (loading) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">Loading course...</div>;
  }

  if (error) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-red-500">Error: {error}</div>;
  }

  if (!courseData) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">No course data available.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
        >
          Back
        </button>
        <h1 className="text-4xl font-bold mb-6 text-center">{courseData.title}</h1>
        <p className="text-lg text-gray-300 mb-8 text-center">{courseData.description}</p>

        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Lessons</h2>
          <ul className="space-y-4">
            {courseData.lessons.map(lesson => (
              <li key={lesson.id} className="bg-gray-700 p-4 rounded-md">
                <h3 className="text-xl font-semibold mb-2">{lesson.title}</h3>
                <p>{lesson.content}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoursePage; 
