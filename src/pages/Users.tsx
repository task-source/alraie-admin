import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  CircularProgress,
} from '@mui/material';
import api from '../api/api'; // Axios instance with baseURL
import Sidebar from '../components/Sidebar';
import PageWrapper from '../components/PageWrapper';
import { useLoader } from '../context/LoaderContext';

interface User {
  id: string | undefined;
  name: string | undefined;
  email: string | undefined;
  role: string | undefined;
  createdAt: string | undefined;
  phone: string | undefined;
}

const Users: React.FC = () => {
  const { showLoader, hideLoader } = useLoader();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [role, setRole] = useState<string>('');

  const fetchUsers = async () => {
    try {
      showLoader();
      const params: any = { page, limit, search };
    if (role) {
      params.role = role;
    }
      const res = await api.get('/admin/users', {
        params
      });
      if(res.data.success){
        setUsers(res.data.users || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, role]);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search, role]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box style={{flex:1}}>
      <PageWrapper>
        <Typography variant="h4" gutterBottom>
          Users
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="superadmin">Super Admin</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={() => fetchUsers()}>
            Apply
          </Button>
        </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {/* <TableCell>Name</TableCell> */}
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      {/* <TableCell>{user?.name ?? ""}</TableCell> */}
                      <TableCell>{user?.phone?? "N/A"}</TableCell>
                      <TableCell>{user?.email?? "N/A"}</TableCell>
                      <TableCell>{user?.role}</TableCell>
                      <TableCell>{user?.createdAt ? new Date(user?.createdAt)?.toLocaleString() : "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
      </PageWrapper>
      </Box>
    </Box>
  );
};

export default Users;
