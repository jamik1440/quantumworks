import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project, Bid, User } from '../types';
import api from '../services/api';

interface MarketplaceContextType {
  projects: Project[];
  users: User[];
  addProject: (project: Project) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;
  addBid: (bid: Bid) => void;
  deleteUser: (userId: string) => void;
  banUser: (userId: string) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch Projects from Backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects/');
        const backendProjects = response.data.map((bp: any) => ({
          id: bp.id.toString(),
          authorId: bp.author_id.toString(),
          authorName: bp.author_name || 'Anonymous',
          title: bp.title,
          description: bp.description,
          budget: bp.budget,
          skills: bp.skills.split(',').map((s: string) => s.trim()),
          category: bp.category,
          postedAt: new Date(bp.created_at).toLocaleDateString(), // Simple format
          status: bp.status,
          bids: [] // Bids not yet implemented in backend
        }));
        setProjects(backendProjects);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    };
    fetchProjects();
  }, []);

  const addProject = async (project: Project) => {
    try {
      // Backend expects snake_case and specific fields
      const payload = {
        title: project.title,
        description: project.description,
        budget: project.budget,
        skills: project.skills.join(', '),
        category: project.category
      };

      const response = await api.post('/projects/', payload);
      const bp = response.data;

      const newProject: Project = {
        id: bp.id.toString(),
        authorId: bp.author_id.toString(),
        authorName: bp.author_name || 'Me', // Optimistic or from response
        title: bp.title,
        description: bp.description,
        budget: bp.budget,
        skills: bp.skills.split(',').map((s: string) => s.trim()),
        category: bp.category,
        postedAt: 'Just now',
        status: bp.status,
        bids: []
      };

      setProjects(prev => [newProject, ...prev]);
    } catch (error) {
      console.error("Failed to create project", error);
      throw error; // Let component handle error
    }
  };

  // Fetch Users from Backend (Admin only)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        const backendUsers = response.data.map((bu: any) => ({
          id: bu.id.toString(),
          name: bu.full_name || bu.email.split('@')[0],
          email: bu.email,
          role: bu.role,
          banned: !bu.is_active,
          skills: bu.role === 'freelancer' ? [] : undefined,
          companyName: bu.role === 'employer' ? bu.full_name : undefined
        }));
        setUsers(backendUsers);
      } catch (error: any) {
        // Only fetch users if admin, otherwise keep mock data
        if (error.response?.status !== 403) {
          console.error("Failed to fetch users", error);
        }
      }
    };
    fetchUsers();
  }, []);

  const updateProjectStatus = async (id: string, status: Project['status']) => {
    try {
      await api.patch(`/admin/projects/${id}/status`, { status });
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (error) {
      console.error("Failed to update project status", error);
      throw error;
    }
  };

  const addBid = (bid: Bid) => {
    setProjects(prev => prev.map(p => {
      if (p.id === bid.projectId) {
        return { ...p, bids: [...p.bids, bid] };
      }
      return p;
    }));
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user", error);
      throw error;
    }
  };

  const banUser = async (userId: string) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/ban`);
      const updatedUser = response.data;
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, banned: !updatedUser.is_active } 
          : u
      ));
    } catch (error) {
      console.error("Failed to ban user", error);
      throw error;
    }
  };

  return (
    <MarketplaceContext.Provider value={{
      projects,
      users,
      addProject,
      updateProjectStatus,
      addBid,
      deleteUser,
      banUser
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
