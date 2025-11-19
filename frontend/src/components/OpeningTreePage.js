import React from 'react';

const OpeningTreePage = () => (
  <div className="w-full h-[80vh] flex flex-col items-center">
    <h1 className="text-2xl font-bold my-4">Opening Tree</h1>
    <iframe
      src="https://www.openingtree.com"
      title="Opening Tree"
      width="100%"
      height="700px"
      style={{ border: '1px solid #ccc', borderRadius: '8px' }}
      allowFullScreen
    />
    <p className="mt-2 text-gray-500 text-xs">
      Powered by <a href="https://www.openingtree.com" target="_blank" rel="noopener noreferrer" className="underline">OpeningTree</a>
    </p>
  </div>
);

export default OpeningTreePage; 