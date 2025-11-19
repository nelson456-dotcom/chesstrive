import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Chess } from 'chess.js';

const CreateOpeningPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'Beginner',
    category: 'Attack'
  });
  const [lines, setLines] = useState([
    {
      name: 'Main Line',
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      moves: [],
      moveExplanations: [],
      orientation: 'white',
      userSide: 'white'
    }
  ]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addLine = () => {
    setLines([...lines, {
      name: `Variation ${lines.length + 1}`,
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      moves: [],
      moveExplanations: [],
      orientation: 'white',
      userSide: 'white'
    }]);
  };

  const removeLine = (index) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
      if (currentLineIndex >= index) {
        setCurrentLineIndex(Math.max(0, currentLineIndex - 1));
      }
    }
  };

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const addMove = (lineIndex) => {
    const newLines = [...lines];
    newLines[lineIndex].moves.push('');
    newLines[lineIndex].moveExplanations.push('');
    setLines(newLines);
  };

  const removeMove = (lineIndex, moveIndex) => {
    const newLines = [...lines];
    newLines[lineIndex].moves.splice(moveIndex, 1);
    newLines[lineIndex].moveExplanations.splice(moveIndex, 1);
    setLines(newLines);
  };

  const updateMove = (lineIndex, moveIndex, field, value) => {
    const newLines = [...lines];
    if (field === 'move') {
      newLines[lineIndex].moves[moveIndex] = value;
    } else if (field === 'explanation') {
      newLines[lineIndex].moveExplanations[moveIndex] = value;
    }
    setLines(newLines);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to create openings');
        return;
      }

      // Validate that at least one line has moves
      const validLines = lines.filter(line => line.moves.length > 0);
      if (validLines.length === 0) {
        alert('Please add at least one move to your opening');
        return;
      }

      const response = await fetch('http://localhost:3001/api/openings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          ...formData,
          lines: validLines
        })
      });

      if (response.ok) {
        alert('Opening created successfully!');
        navigate('/openings');
      } else {
        const error = await response.json();
        alert(`Failed to create opening: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating opening:', error);
      alert('Error creating opening');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/openings')}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Openings</span>
        </button>

        <h1 className="text-3xl font-bold mb-8">Create New Opening</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Opening Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="Attack">Attack</option>
                  <option value="Defense">Defense</option>
                  <option value="Gambit">Gambit</option>
                  <option value="System">System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Lines/Variations */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Lines & Variations</h2>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Line</span>
              </button>
            </div>

            {/* Line Tabs */}
            <div className="flex space-x-2 mb-4 overflow-x-auto">
              {lines.map((line, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentLineIndex(index)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentLineIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {line.name}
                </button>
              ))}
            </div>

            {/* Current Line */}
            {lines[currentLineIndex] && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={lines[currentLineIndex].name}
                    onChange={(e) => updateLine(currentLineIndex, 'name', e.target.value)}
                    className="text-lg font-semibold bg-transparent border-b border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(currentLineIndex)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Moves */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Moves</h3>
                    <button
                      type="button"
                      onClick={() => addMove(currentLineIndex)}
                      className="inline-flex items-center space-x-1 bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Move</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {lines[currentLineIndex].moves.map((move, moveIndex) => (
                      <div key={moveIndex} className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="e4"
                          value={move}
                          onChange={(e) => updateMove(currentLineIndex, moveIndex, 'move', e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Explanation"
                          value={lines[currentLineIndex].moveExplanations[moveIndex] || ''}
                          onChange={(e) => updateMove(currentLineIndex, moveIndex, 'explanation', e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeMove(currentLineIndex, moveIndex)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? 'Creating...' : 'Create Opening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOpeningPage;
