import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { listProjects } from "../../api/project.api";
import ProjectCard from "./ProjectCard";
import { Button, Container, Row, Col, Spinner } from "react-bootstrap";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await listProjects();
        setProjects(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Open Projects</h2>
        {user && (
          <Button href="/projects/new" variant="primary">
            Create Project
          </Button>
        )}
      </div>

      <Row>
        {projects.length === 0 ? (
          <Col>
            <p className="text-center">No projects available</p>
          </Col>
        ) : (
          projects.map((project) => (
            <Col key={project.id} md={6} lg={4} className="mb-4">
              <ProjectCard project={project} userId={user?.id} />
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default ProjectList;
