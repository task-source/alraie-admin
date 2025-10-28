import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { TextField, Button, Box } from '@mui/material';
import { useLoader } from '../context/LoaderContext';

const Login = () => {
  const { showLoader, hideLoader } = useLoader();
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      showLoader();
      const res = await api.post('/auth/login', { accountType: "email",email, password,  language: "en", });
       if(res.data.success){
         setToken(res.data.refreshToken);
         navigate('/');
       }
    } catch (err) {
      console.error(err);
    }finally{
      hideLoader();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: 300, margin: 'auto', marginTop: 10 }}>
      <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mt: 2 }} />
      <Button variant="contained" onClick={handleLogin} sx={{ mt: 3 }}>Login</Button>
    </Box>
  );
};

export default Login;