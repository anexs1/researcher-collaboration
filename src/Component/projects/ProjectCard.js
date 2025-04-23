import React from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import StatusBadge from "../ui/StatusBadge";
import { sendJoinRequest } from "../../api/request.api";

const ProjectCard = ({ project, userId }) => {
  const handleJoinRequest = async () => {
    try {
      await sendJoinRequest(project.id);
      alert("Join request sent successfully!");
    } catch (error) {
      alert("Failed to send request: " + error.message);
    }
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <Card.Title>{project.title}</Card.Title>
          <StatusBadge status={project.status} />
        </div>
        <Card.Text className="text-muted mb-2">
          {project.description.length > 100
            ? `${project.description.substring(0, 100)}...`
            : project.description}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            {project.current_collaborators}/{project.required_collaborators}{" "}
            collaborators
          </small>
          {project.is_collaborator ? (
            <Button
              as={Link}
              to={`/projects/${project.id}`}
              variant="outline-primary"
              size="sm"
            >
              View Project
            </Button>
          ) : userId && userId !== project.owner_id ? (
            <Button variant="primary" size="sm" onClick={handleJoinRequest}>
              Request to Join
            </Button>
          ) : null}
        </div>
      </Card.Body>
      <Card.Footer className="text-muted">
        <small>Created by {project.owner_name}</small>
      </Card.Footer>
    </Card>
  );
};

export default ProjectCard;
