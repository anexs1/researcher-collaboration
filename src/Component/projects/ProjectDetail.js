import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Tab,
  Tabs,
  Alert,
  Badge,
  ListGroup,
} from "react-bootstrap";
import { getProjectDetails } from "../../api/project.api";
import { getJoinRequests } from "../../api/request.api";
import ChatRoom from "../chat/ChatRoom";
import RequestList from "../requests/RequestList";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await getProjectDetails(id);
        setProject(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!project) return <Alert variant="warning">Project not found</Alert>;

  return (
    <div className="project-detail">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{project.title}</h2>
        {project.isOwner && (
          <div>
            <Button
              variant="outline-secondary"
              className="me-2"
              onClick={() => navigate(`/projects/${id}/edit`)}
            >
              Edit
            </Button>
            <Button variant="danger" onClick={() => handleDeleteProject(id)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="details" title="Details">
          <Card className="mb-3">
            <Card.Body>
              <Card.Text>{project.description}</Card.Text>
              <div className="d-flex justify-content-between">
                <div>
                  <Badge bg="info" className="me-2">
                    {project.status}
                  </Badge>
                  <span className="text-muted">
                    {project.collaborators.length}/
                    {project.required_collaborators} collaborators
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>

          <h4>Collaborators</h4>
          <ListGroup className="mb-4">
            {project.collaborators.map((collaborator) => (
              <ListGroup.Item key={collaborator.user_id}>
                {collaborator.user_name}
                {collaborator.role === "owner" && (
                  <Badge bg="primary" className="ms-2">
                    Owner
                  </Badge>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Tab>

        {project.isOwner && (
          <Tab eventKey="requests" title="Join Requests">
            <RequestList projectId={id} />
          </Tab>
        )}

        {project.hasChat && project.isCollaborator && (
          <Tab eventKey="chat" title="Project Chat">
            <ChatRoom projectId={id} />
          </Tab>
        )}
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
