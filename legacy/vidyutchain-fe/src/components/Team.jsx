import React from 'react';
import Navbar from './Navbar';
import 'animate.css/animate.min.css';
import raviPhoto from '../assets/IMG-20241018-WA0008(3).jpg';
import hemrajPhoto from '../assets/Hemraj Sir photo.jpg';
import matruPhoto from '../assets/Matrupriya Photo.jpg';

const Team = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Ravi Shankar',
      role: 'CTO & Co-Founder',
      bio: 'Ravi has over 3 years of experience in renewable energy and blockchain technology. He founded VidyutChain with a vision to revolutionize energy trading.',
      image: raviPhoto,
      linkedin: 'https://www.linkedin.com/in/ravi-shankar-3bab62247/',

    },
    {
      id: 2,
      name: 'Matrupriya Dibyanshu Panda',
      role: 'CEO & Co-Founder',
      bio: 'Matrupriya has extensive experience in renewable energy markets and sustainable technologies. He brings strong leadership and vision to VidyutChain.',
      image: matruPhoto,
      linkedin: 'https://www.linkedin.com/in/matrupriya-dibyanshu-panda-386b38251/',

    },
    {
      id: 3,
      name: 'Dr Hemraj Lamkuche',
      role: 'Advisor & Co-Founder',
      bio: 'Hemraj leads our company with deep expertise in renewable energy markets and sustainable technologies. He brings strong leadership and vision to VidyutChain.',
      image: hemrajPhoto,
      linkedin: 'https://www.linkedin.com/in/dr-hemraj-lamkuche-4b760040/',
     
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 to-blue-400 bg-clip-text text-transparent mb-4 animate__animated animate__fadeIn">
            Our Team
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto animate__animated animate__fadeIn animate__delay-1s">
            Meet the passionate individuals driving VidyutChain's mission to revolutionize renewable energy
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <TeamMemberCard 
              key={member.id} 
              member={member} 
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const TeamMemberCard = ({ member, index }) => {
  // Calculate animation delay based on index
  const delayClass = `animate__delay-${Math.min(5, index) * 2}s`;
  
  return (
    <div className={`bg-gray-800/50 rounded-xl overflow-hidden shadow-lg border border-purple-500/20 transition-all duration-300 hover:shadow-purple-600/30 hover:scale-105 animate__animated animate__fadeIn ${delayClass}`}>
      <div className="relative flex items-center justify-center bg-gray-900 h-72">
        <div className="w-full h-full max-w-[300px] px-4 py-6 flex items-center justify-center">
          <img 
            src={member.image} 
            alt={member.name} 
            className="object-cover rounded-md max-h-full max-w-full shadow-lg"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent h-16"></div>
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-white mb-1">{member.name}</h3>
        <p className="text-purple-400 font-medium mb-4">{member.role}</p>
        <p className="text-gray-300 mb-4">{member.bio}</p>
        
        <div className="flex space-x-3">
          <a 
            href={member.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
          
        </div>
      </div>
    </div>
  );
};

export default Team; 