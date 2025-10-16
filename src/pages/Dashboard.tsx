import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageWrapper from '../components/PageWrapper';
import { Box, Typography, Paper } from '@mui/material';
import api from '../api/api';

const Dashboard = () => {
  const [totalUsers, setTotalUsers] =  useState(0);
  const [totalOwners, setTotalOwners] =  useState(0);
  const [totalAdmins, setTotalAdmins] =  useState(0);
  const [totalAssistants, setTotalAssistants] =  useState(0);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/dashboard/stats');
        if(res.data.success){
          let data =  res.data.data;          
          setTotalUsers(data.totalUsers);
          setTotalOwners(data.totalOwners);
          setTotalAdmins(data.totalAdmins);
          setTotalAssistants(data.totalAssistants);
        }
        
      } catch (err) {
        console.error('Failed to fetch terms', err);
      }
    })();
  }, []);
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box style={{flex:1}}>
      <PageWrapper>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        {/* Flex container instead of Grid */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2, // spacing between items
          }}
        >
          <Paper sx={{ flex: '1 1 300px', p: 2 }}>Total Users: {totalUsers}</Paper>
          <Paper sx={{ flex: '1 1 300px', p: 2 }}>Total Owners: {totalOwners}</Paper>
          <Paper sx={{ flex: '1 1 300px', p: 2 }}>Total Assistants: {totalAssistants}</Paper>
          <Paper sx={{ flex: '1 1 300px', p: 2 }}>Total Admins: {totalAdmins}</Paper>
        </Box>
      </PageWrapper>
      </Box>
    </Box>
  );
};

export default Dashboard;