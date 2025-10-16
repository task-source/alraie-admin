import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageWrapper from '../components/PageWrapper';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import api from '../api/api';

interface AnimalType {
  _id: string;
  name_en: string;
  name_ar: string;
  key: string;
  category: 'farm' | 'pet';
  createdAt: string;
}

const AnimalTypes: React.FC = () => {
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [category, setCategory] = useState<string>(''); // all/farm/pet
  const [loading, setLoading] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editing, setEditing] = useState<AnimalType | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    key: '',
    category: '',
  });

  const fetchAnimalTypes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (category && category !== 'all') {
        params.category = category;
      }

      const res = await api.get('/admin/animalType', { params });
      if (res.data.success) {
        setAnimalTypes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching animal types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimalTypes();
  }, [category]);

  const handleOpenDialog = (animal?: AnimalType) => {
    if (animal) {
      setEditing(animal);
      setFormData({
        name_en: animal.name_en,
        name_ar: animal.name_ar,
        key: animal.key,
        category: animal.category,
      });
    } else {
      setEditing(null);
      setFormData({ name_en: '', name_ar: '', key: '', category: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  // Updated handleChange
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target as { name: string; value: string };
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await api.put(`/admin/animalType/${editing._id}`, formData);
      } else {
        await api.post('/admin/animalType', formData);
      }
      handleCloseDialog();
      fetchAnimalTypes();
    } catch (err) {
      console.error('Error saving animal type:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this animal type?')) return;
    try {
      await api.delete(`/admin/animalType/${id}`);
      fetchAnimalTypes();
    } catch (err) {
      console.error('Error deleting animal type:', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box flex={1}>
      <PageWrapper>
        <Typography variant="h4" gutterBottom>
          Animal Types
        </Typography>

        {/* Filter and Add */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="farm">Farm</MenuItem>
              <MenuItem value="pet">Pet</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" onClick={() => handleOpenDialog()}>
            + Add Animal Type
          </Button>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>English Name</TableCell>
                  <TableCell>Arabic Name</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {animalTypes.length > 0 ? (
                  animalTypes.map((animal) => (
                    <TableRow key={animal._id}>
                      <TableCell>{animal.name_en}</TableCell>
                      <TableCell>{animal.name_ar}</TableCell>
                      <TableCell>{animal.key}</TableCell>
                      <TableCell>{animal.category}</TableCell>
                      <TableCell>{new Date(animal.createdAt).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDialog(animal)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleDelete(animal._id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No animal types found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
          <DialogTitle>{editing ? 'Edit Animal Type' : 'Add Animal Type'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="English Name"
                name="name_en"
                value={formData.name_en}
                onChange={(e)=>{handleChange(e as React.ChangeEvent<HTMLInputElement>)}}
                fullWidth
              />
              <TextField
                label="Arabic Name"
                name="name_ar"
                value={formData.name_ar}
                onChange={(e)=>{handleChange(e as React.ChangeEvent<HTMLInputElement>)}}
                fullWidth
              />
              {!editing && (
                <TextField
                  label="Key"
                  name="key"
                  value={formData.key}
                  onChange={(e)=>{handleChange(e as React.ChangeEvent<HTMLInputElement>)}}
                  fullWidth
                />
              )}
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="Category"
                  onChange={(e)=>{handleChange(e as SelectChangeEvent<string>)}}
                >
                  <MenuItem value="farm">Farm</MenuItem>
                  <MenuItem value="pet">Pet</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </PageWrapper>
      </Box>
    </Box>
  );
};

export default AnimalTypes;
