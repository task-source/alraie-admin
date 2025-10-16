import React, { useState } from 'react';
import { List, ListItem, ListItemText,ListItemButton, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div>
      <IconButton
        onClick={() => setOpen(!open)}
        sx={{ position: 'fixed', top: 10, left: 10, zIndex: 2000 }}
      >
        <MenuIcon style={{color:"#FFF"}}/>
      </IconButton>

      <motion.div
        animate={{ width: open ? 240 : 60 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          backgroundColor: '#1f2937',
          color: '#fff',
          overflowX: 'hidden',
          padding:"25px 0px"
        }}
      >
        <List>
          {[
            { text: 'Dashboard', path: '/' },
            { text: 'Users', path: '/users' },
            { text: 'Terms & Conditions', path: '/terms' },
            { text: 'Privacy Policy', path: '/privacy' },
            { text: 'Animal Type', path: '/animalType' },
          ].map((item) => (
<ListItem key={item.text} sx={{ px: 0 }}>
  <ListItemButton onClick={() => navigate(item.path)} sx={{ px: open ? 3 : 1 }}>
    <ListItemText
      primary={item.text}
      sx={{ opacity: open ? 1 : 0, transition: 'opacity 0.3s' }}
    />
  </ListItemButton>
</ListItem>
          ))}
          <ListItem key={"Logout"} sx={{ px: 0 }}>
  <ListItemButton 
  onClick={() =>{ 
    logout()
    navigate("Login")}}
    sx={{ px: open ? 3 : 1 }}>
    <ListItemText
      primary={"Logout"}
      sx={{ opacity: open ? 1 : 0, transition: 'opacity 0.3s' }}
    />
  </ListItemButton>
</ListItem>
        </List>
      </motion.div>

      <Box sx={{ ml: open ? '240px' : '60px', transition: 'margin 0.3s' }} />
    </div>
  );
};

export default Sidebar;