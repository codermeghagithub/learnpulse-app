/**
 * Computer Networks (CN) Seed Data
 * Prerequisite Chain:
 *   OSI Model → TCP/IP → Routing → Congestion Control
 *   TCP/IP → Sockets
 */

export const cnCourse = {
  title: "Computer Networks",
  subject: "Computer Science",
  concepts: [
    {
      key: "osi-model",
      name: "OSI Model",
      difficulty: "easy",
      description: "The 7-layer reference architecture: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
    },
    {
      key: "tcp-ip",
      name: "TCP/IP Protocol Suite",
      difficulty: "easy",
      description: "IP addressing, subnetting, TCP three-way handshake, UDP, and segment headers.",
    },
    {
      key: "routing",
      name: "Routing Algorithms",
      difficulty: "medium",
      description: "Unicast routing, Distance Vector (Bellman-Ford), Link State (Dijkstra), OSPF, and BGP.",
    },
    {
      key: "congestion-control",
      name: "Congestion Control",
      difficulty: "hard",
      description: "TCP Reno/Tahoe, AIMD (Additive Increase Multiplicative Decrease), Slow Start, and Fast Recovery.",
    },
    {
      key: "sockets",
      name: "Network Sockets",
      difficulty: "medium",
      description: "Socket API: bind, listen, accept, connect, port multiplexing, and client-server architecture.",
    },
  ],
  edges: [
    { from: "osi-model", to: "tcp-ip", weight: 2 },
    { from: "tcp-ip", to: "routing", weight: 2 },
    { from: "routing", to: "congestion-control", weight: 3 },
    { from: "tcp-ip", to: "sockets", weight: 2 },
  ],
  questions: {
    "osi-model": [
      {
        question_text: "Which layer of the OSI model is responsible for end-to-end communication, segmentation, and flow control?",
        options: [
          { key: "A", text: "Data Link Layer" },
          { key: "B", text: "Network Layer" },
          { key: "C", text: "Transport Layer" },
          { key: "D", text: "Session Layer" },
        ],
        correct_answer: "C",
        explanation: "The Transport Layer (Layer 4) handles transparent transfer of data between end systems with flow and error control.",
        difficulty: "easy",
      },
      {
        question_text: "What is the Protocol Data Unit (PDU) called at the Data Link layer?",
        options: [
          { key: "A", text: "Packet" },
          { key: "B", text: "Frame" },
          { key: "C", text: "Segment" },
          { key: "D", text: "Bitstream" },
        ],
        correct_answer: "B",
        explanation: "PDU names across layers: Physical (Bits), Data Link (Frames), Network (Packets), Transport (Segments), Application (Data).",
        difficulty: "easy",
      },
    ],
    "tcp-ip": [
      {
        question_text: "What sequence of TCP flag packets establishes a standard TCP connection?",
        options: [
          { key: "A", text: "SYN → SYN-ACK → ACK" },
          { key: "B", text: "ACK → SYN → ACK" },
          { key: "C", text: "FIN → ACK → FIN" },
          { key: "D", text: "SYN → ACK → DATA" },
        ],
        correct_answer: "A",
        explanation: "TCP uses a three-way handshake: Client sends SYN, Server replies with SYN-ACK, Client acknowledges with ACK.",
        difficulty: "easy",
      },
      {
        question_text: "Which IP header field prevents packets from circulating indefinitely in network loops?",
        options: [
          { key: "A", text: "Type of Service (ToS)" },
          { key: "B", text: "Time to Live (TTL)" },
          { key: "C", text: "Header Checksum" },
          { key: "D", text: "Identification" },
        ],
        correct_answer: "B",
        explanation: "Each router decrements the TTL field by 1; when TTL hits 0, the packet is discarded and an ICMP Time Exceeded message is sent back.",
        difficulty: "easy",
      },
    ],
    routing: [
      {
        question_text: "Which shortest-path algorithm is used by Link-State routing protocols such as OSPF?",
        options: [
          { key: "A", text: "Bellman-Ford Algorithm" },
          { key: "B", text: "Dijkstra's Algorithm" },
          { key: "C", text: "Floyd-Warshall Algorithm" },
          { key: "D", text: "Kruskal's Algorithm" },
        ],
        correct_answer: "B",
        explanation: "Link-state routing protocols flood link state packets to all routers so every node runs Dijkstra's algorithm to compute shortest paths.",
        difficulty: "medium",
      },
      {
        question_text: "What problem occurs in Distance Vector routing when a link fails and routers continuously increment distance metrics?",
        options: [
          { key: "A", text: "Subnet starvation" },
          { key: "B", text: "Count-to-Infinity problem" },
          { key: "C", text: "Jitter magnification" },
          { key: "D", text: "Bufferbloat" },
        ],
        correct_answer: "B",
        explanation: "In distance vector routing, routing loops cause metrics to increment gradually to infinity, addressed via Split Horizon and Poison Reverse.",
        difficulty: "medium",
      },
    ],
    "congestion-control": [
      {
        question_text: "In TCP Congestion Control, how does the congestion window (cwnd) increase during the Slow Start phase?",
        options: [
          { key: "A", text: "Linearly by 1 MSS per RTT" },
          { key: "B", text: "Exponentially, doubling every RTT" },
          { key: "C", text: "By 3 MSS per duplicate ACK" },
          { key: "D", text: "It remains constant until ssthresh is reached" },
        ],
        correct_answer: "B",
        explanation: "During Slow Start, cwnd increases by 1 MSS for every received ACK, effectively doubling the congestion window every Round Trip Time (RTT).",
        difficulty: "hard",
      },
      {
        question_text: "What event typically triggers TCP Fast Retransmit without waiting for a retransmission timeout (RTO)?",
        options: [
          { key: "A", text: "Receipt of 3 duplicate ACKs" },
          { key: "B", text: "An ICMP Destination Unreachable message" },
          { key: "C", text: "Window probe expiration" },
          { key: "D", text: "A SYN packet collision" },
        ],
        correct_answer: "A",
        explanation: "Fast Retransmit sends the missing segment immediately upon receiving 3 duplicate ACKs (4 identical ACKs total).",
        difficulty: "hard",
      },
      {
        question_text: "What does AIMD stand for in network congestion avoidance?",
        options: [
          { key: "A", text: "Additive Increase Multiplicative Decrease" },
          { key: "B", text: "Asynchronous Injection Multiple Delivery" },
          { key: "C", text: "Adaptive Interface Multipath Distribution" },
          { key: "D", text: "Automatic Interval Minimum Delay" },
        ],
        correct_answer: "A",
        explanation: "AIMD increases cwnd linearly in congestion avoidance and cuts cwnd in half multiplicatively upon packet loss, providing fair sharing.",
        difficulty: "hard",
      },
    ],
    sockets: [
      {
        question_text: "On a server, which socket system call transitions an un-connected stream socket into a passive listening state?",
        options: [
          { key: "A", text: "bind()" },
          { key: "B", text: "listen()" },
          { key: "C", text: "accept()" },
          { key: "D", text: "connect()" },
        ],
        correct_answer: "B",
        explanation: "listen() marks the socket referred to by the descriptor as a passive socket that will be used to accept incoming connection requests.",
        difficulty: "medium",
      },
      {
        question_text: "What does accept() return when a new client connects to a TCP server?",
        options: [
          { key: "A", text: "A boolean flag indicating true" },
          { key: "B", text: "The client's MAC address" },
          { key: "C", text: "A new socket file descriptor dedicated to that client" },
          { key: "D", text: "The number of bytes sent" },
        ],
        correct_answer: "C",
        explanation: "accept() creates and returns a brand new socket file descriptor dedicated to communication with that specific connected client.",
        difficulty: "medium",
      },
    ],
  },
};
