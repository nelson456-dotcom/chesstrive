import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, User, Calendar, Tag, ChevronRight } from 'lucide-react';

const StudiesPage = () => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'name', 'chapters'
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/studies', {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched studies:', data);
      console.log('Number of studies:', data.studies?.length);
      
      // Debug: Check if chapters are different - focus on imported studies
      if (data.studies && data.studies.length > 0) {
        console.log('\n=== IMPORTED STUDIES DEBUG ===');
        const importedStudies = data.studies.filter(s => s.tags && s.tags.includes('imported'));
        console.log(`Found ${importedStudies.length} imported studies`);
        
        importedStudies.slice(0, 5).forEach((study, idx) => {
          console.log(`\n📚 Study ${idx + 1}: ${study.name}`);
          console.log(`   Study ID: ${study._id}`);
          console.log(`   Chapters: ${study.chapters?.length || 0}`);
          if (study.chapters && study.chapters.length > 0) {
            console.log(`   First 3 chapter names:`);
            study.chapters.slice(0, 3).forEach((ch, i) => {
              console.log(`     ${i + 1}. ${ch.name} (ID: ${ch._id})`);
            });
          }
        });
      }
      
      setStudies(data.studies || []);
    } catch (error) {
      console.error('Error fetching studies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags
  const allTags = ['all', ...new Set(studies.flatMap(s => s.tags || []))];

  // Filter and sort studies
  const filteredStudies = studies
    .filter(study => {
      const matchesSearch = study.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (study.description && study.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = selectedTag === 'all' || (study.tags && study.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'chapters') {
        return (b.chapterCount || 0) - (a.chapterCount || 0);
      } else {
        // Default: sort by updated date
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

  const handleStudyClick = (studyId) => {
    navigate(`/enhanced-chess-study?studyId=${studyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading studies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <BookOpen className="w-12 h-12" />
            Chess Studies Library
          </h1>
          <p className="text-xl text-gray-300">
            Explore {filteredStudies.length} of {studies.length} available studies
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search studies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tag Filter */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {allTags.map(tag => (
                  <option key={tag} value={tag} className="bg-gray-800">
                    {tag === 'all' ? 'All Tags' : tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Sort Options */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setSortBy('updated')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === 'updated' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Recently Updated
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === 'name' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Name (A-Z)
            </button>
            <button
              onClick={() => setSortBy('chapters')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === 'chapters' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Most Chapters
            </button>
          </div>
        </div>

        {/* Studies Grid */}
        {filteredStudies.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-24 h-24 text-gray-500 mx-auto mb-4" />
            <p className="text-2xl text-gray-400">No studies found</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudies.map(study => (
              <div
                key={study._id}
                onClick={() => handleStudyClick(study._id)}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-blue-400 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
              >
                {/* Study Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                      {study.name}
                    </h3>
                    {study.description && (
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {study.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                </div>

                {/* Study Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <BookOpen className="w-4 h-4" />
                    <span>{study.chapterCount || 0} chapters</span>
                  </div>

                  {study.authorId && (
                    <div className="flex items-center gap-2">
                      {study.isOwner ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                          <User className="w-3 h-3" />
                          Owner
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                          <User className="w-3 h-3" />
                          {study.authorId?.username || 'Unknown'}
                        </div>
                      )}
                    </div>
                  )}

                  {study.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(study.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {study.tags && study.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {study.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                    {study.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full border border-gray-500/30">
                        +{study.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Showing <span className="text-white font-semibold">{filteredStudies.length}</span> of{' '}
            <span className="text-white font-semibold">{studies.length}</span> studies
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudiesPage;

